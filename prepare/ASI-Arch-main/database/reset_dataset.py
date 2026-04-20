import requests
from datetime import datetime
# API Configuration
API_BASE_URL = "http://localhost:8001"
def add_element_via_api(element_data):
    """Adds a data element via the API"""
    url = f"{API_BASE_URL}/elements"
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.post(url, headers=headers, json=element_data)
        response.raise_for_status()  # Raises an exception for bad status codes
        
        result = response.json()
        print(f"✅ Successfully added: {result}")
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to add: {e}")
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_detail = e.response.json()
                print(f"Error details: {error_detail}")
            except:
                print(f"Response content: {e.response.text}")
        return False
# Prepare the data
current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
# Complete raw data (including column names for logging)
full_train_data = """step,100,200,300,400,500,600,700,800,900,1000,1100,1200,1300,1400,1500,1600,1700,1800,1900,2000
loss,10.2629,8.9712,7.6769,6.9779,6.5788,6.2249,6.0558,5.8544,5.7071,5.5044,5.3517,5.2153,5.1558,4.9783,4.9156,4.9054,4.7193,4.6739,4.6408,4.5787"""

full_test_data = """Model,ARC Challenge,ARC Easy,BoolQ,FDA,HellaSwag,LAMBDA OpenAI,OpenBookQA,PIQA,Social IQA,SQuAD Completion,SWDE,WinoGrande,Average
delta_net,0.168,0.324,0.364,0.000,0.296,0.002,0.136,0.526,0.354,0.002,0.008,0.504,0.224"""
program_code = '''python
# -*- coding: utf-8 -*-
# Copyright (c) 2023-2025, Songlin Yang, Yu Zhang
from __future__ import annotations
from typing import TYPE_CHECKING, Dict, Optional, Tuple
import torch
import torch.nn as nn
from einops import rearrange
from torch.nn import functional as F
from fla.layers.utils import get_unpad_data, index_first_axis, pad_input
from fla.modules import FusedRMSNormGated, RMSNorm, ShortConvolution
from fla.modules.l2norm import l2norm
def softmax(x):
    return F.softmax(x, dim=-1)

@torch.compile
def delta_rule_chunkwise(q, k, v, beta, chunk_size=32):
    b, h, l, d_k = q.shape
    d_v = v.shape[-1]
    
    # Calculate padding
    pad_len = (chunk_size - l % chunk_size) % chunk_size
    if pad_len > 0:
        # Pad inputs
        q = F.pad(q, (0, 0, 0, pad_len))
        k = F.pad(k, (0, 0, 0, pad_len))
        v = F.pad(v, (0, 0, 0, pad_len))
        beta = F.pad(beta, (0, pad_len))
    
    padded_len = l + pad_len
    # q = q * (d_k ** -0.5)
    q = l2norm(q)
    k = l2norm(k)
    v = v * beta[..., None]
    k_beta = k * beta[..., None]
    
    # compute (I - tri(diag(beta) KK^T))^{-1}
    mask = torch.triu(torch.ones(chunk_size, chunk_size, dtype=torch.bool, device=q.device), diagonal=0)
    q, k, v, k_beta = map(lambda x: rearrange(x, 'b h (n c) d -> b h n c d', c=chunk_size), [q, k, v, k_beta])
    attn = -(k_beta @ k.transpose(-1, -2)).masked_fill(mask, 0)
    for i in range(1, chunk_size):
        attn[..., i, :i] = attn[..., i, :i] + (attn[..., i, :, None].clone() * attn[..., :, :i].clone()).sum(-2)
    attn = attn + torch.eye(chunk_size, dtype=torch.float, device=q.device)
    attn = attn.to(torch.bfloat16)
    u = attn @ v
    w = attn @ k_beta
    S = k.new_zeros(b, h, d_k, d_v)
    o = torch.zeros_like(v)
    mask = torch.triu(torch.ones(chunk_size, chunk_size, dtype=torch.bool, device=q.device), diagonal=1)
    for i in range(0, padded_len // chunk_size):
        q_i, k_i = q[:, :, i], k[:, :, i]
        attn = (q_i @ k_i.transpose(-1, -2)).masked_fill_(mask, 0)
        u_i = u[:, :, i] - w[:, :, i] @ S
        o_inter = q_i @ S
        o[:, :, i] = o_inter + attn @ u_i
        S = S + k_i.transpose(-1, -2) @ u_i
    o = rearrange(o, 'b h n c d -> b h (n c) d')
    # Remove padding if any
    if pad_len > 0:
        o = o[:, :, :l]
    return o, S

if TYPE_CHECKING:
    from transformers.processing_utils import Unpack
    from fla.models.utils import Cache

def elu_p1(x):
    return (F.elu(x, 1., False) + 1.).to(x)

def sum_norm(x):
    return (x / x.sum(-1, keepdim=True)).to(x)

class DeltaNet(nn.Module):
    def __init__(
        self,
        mode: str = 'chunk1',
        d_model: int = None,
        hidden_size: int = 1024,
        expand_k: float = 1.0,
        expand_v: float = 1.0,
        num_heads: int = 4,
        use_beta: bool = True,
        use_gate: bool = False,
        use_short_conv: bool = True,
        conv_size: int = 4,
        conv_bias: bool = False,
        allow_neg_eigval: bool = False,
        layer_idx: int = None,
        qk_activation: str = 'silu',
        qk_norm: str = 'l2',
        norm_eps: float = 1e-5,
        **kwargs
    ) -> DeltaNet:
        super().__init__()
        self.mode = mode
        self.qk_activation = qk_activation
        self.qk_norm = qk_norm
        assert self.qk_activation in ['silu', 'relu', 'elu', 'identity']
        assert self.qk_norm in ['l2', 'sum']
        if d_model is not None:
            hidden_size = d_model
        self.hidden_size = hidden_size
        self.expand_k = expand_k
        self.expand_v = expand_v
        self.num_heads = num_heads
        self.use_gate = use_gate
        self.use_short_conv = use_short_conv
        self.conv_size = conv_size
        self.conv_bias = conv_bias
        self.allow_neg_eigval = allow_neg_eigval
        self.key_dim = int(hidden_size * expand_k)
        self.value_dim = int(hidden_size * expand_v)
        self.head_k_dim = self.key_dim // num_heads
        self.head_v_dim = self.value_dim // num_heads
        self.layer_idx = layer_idx
        assert self.key_dim % num_heads == 0, f"key dim must be divisible by num_heads of {{num_heads}}"
        assert self.value_dim % num_heads == 0, f"value dim must be divisible by num_heads of {{num_heads}}"
        self.q_proj = nn.Linear(hidden_size, self.key_dim, bias=False)
        self.k_proj = nn.Linear(hidden_size, self.key_dim, bias=False)
        self.v_proj = nn.Linear(hidden_size, self.value_dim, bias=False)
        self.use_beta = use_beta
        if self.use_beta:
            self.b_proj = nn.Linear(hidden_size, self.num_heads, bias=False)
        if use_short_conv:
            self.conv_size = conv_size
            self.q_conv1d = ShortConvolution(
                hidden_size=self.key_dim,
                kernel_size=conv_size,
                activation='silu' if qk_activation == 'silu' else None
            )
            self.k_conv1d = ShortConvolution(
                hidden_size=self.key_dim,
                kernel_size=conv_size,
                activation='silu' if qk_activation == 'silu' else None
            )
            self.v_conv1d = ShortConvolution(
                hidden_size=self.value_dim,
                kernel_size=conv_size,
                activation='silu'
            )
        else:
            raise UserWarning(
                "ShortConvolution is crucial to the performance. "
                "Do not turn it off, i.e., setting `use_short_conv=False` unless you know what you are doing."
            )
        if use_gate:
            self.g_proj = nn.Linear(hidden_size, self.value_dim, bias=False)
            self.o_norm = FusedRMSNormGated(self.head_v_dim, eps=norm_eps)
        else:
            self.o_norm = RMSNorm(self.head_v_dim, eps=norm_eps)
        self.o_proj = nn.Linear(self.value_dim, hidden_size, bias=False)
    def forward(
        self,
        hidden_states: torch.Tensor,
        attention_mask: Optional[torch.Tensor] = None,
        past_key_values: Optional[Cache] = None,
        use_cache: Optional[bool] = False,
        output_attentions: Optional[bool] = False,
        **kwargs: Unpack[Dict]
    ) -> Tuple[torch.Tensor, Optional[torch.Tensor], Optional[Cache]]:
        if attention_mask is not None:
            assert len(attention_mask.shape) == 2, (
                "Expected attention_mask as a 0-1 matrix with shape [batch_size, seq_len] "
                "for padding purposes (0 indicating padding). "
                "Arbitrary attention masks of shape [batch_size, seq_len, seq_len] are not allowed."
            )
        batch_size, q_len, _ = hidden_states.shape
        last_state = None
        if past_key_values is not None and len(past_key_values) > self.layer_idx:
            last_state = past_key_values[self.layer_idx]
        cu_seqlens = kwargs.get('cu_seqlens', None)
        if attention_mask is not None:
            indices, cu_seqlens, _ = get_unpad_data(attention_mask[:, -q_len:])
            hidden_states = index_first_axis(rearrange(hidden_states, "b s ... -> (b s) ..."), indices).unsqueeze(0)
        if self.use_short_conv:
            conv_state_q, conv_state_k, conv_state_v = None, None, None
            if last_state is not None:
                conv_state_q, conv_state_k, conv_state_v = last_state['conv_state']
            q, conv_state_q = self.q_conv1d(
                x=self.q_proj(hidden_states),
                cache=conv_state_q,
                output_final_state=use_cache,
                cu_seqlens=cu_seqlens
            )
            k, conv_state_k = self.k_conv1d(
                x=self.k_proj(hidden_states),
                cache=conv_state_k,
                output_final_state=use_cache,
                cu_seqlens=cu_seqlens
            )
            v, conv_state_v = self.v_conv1d(
                x=self.v_proj(hidden_states),
                cache=conv_state_v,
                output_final_state=use_cache,
                cu_seqlens=cu_seqlens
            )
        else:
            q = self.q_proj(hidden_states)
            k = self.k_proj(hidden_states)
            if self.qk_activation == 'silu':
                q, k = F.silu(q), F.silu(k)
            v = F.silu(self.v_proj(hidden_states))
        q, k = map(lambda x: rearrange(x, '... (h d) -> ... h d', d=self.head_k_dim), (q, k))
        v = rearrange(v, '... (h d) -> ... h d', d=self.head_v_dim)
        if self.qk_activation != 'silu':
            if self.qk_activation == 'relu':
                q, k = q.relu(), k.relu()
            elif self.qk_activation == 'elu':
                q, k = elu_p1(q), elu_p1(k)
            elif self.qk_activation != 'identity':
                raise NotImplementedError
        if self.qk_norm == 'sum':
            q = sum_norm(q).to(q)
            k = sum_norm(k).to(k)
        if self.use_beta:
            beta = self.b_proj(hidden_states).sigmoid()
        else:
            beta = torch.ones_like(q[..., 0])
        if self.allow_neg_eigval:
            beta = beta * 2.
        
        recurrent_state = last_state['recurrent_state'] if last_state is not None else None
        q = rearrange(q, 'b l h d -> b h l d')
        k = rearrange(k, 'b l h d -> b h l d')
        v = rearrange(v, 'b l h d -> b h l d')
        beta = rearrange(beta, 'b l h -> b h l')
            
        o, recurrent_state = delta_rule_chunkwise(
            q=q,
            k=k,
            v=v,
            beta=beta,
        )
        o = rearrange(o, 'b h l d -> b l h d')
        if past_key_values is not None:
            past_key_values.update(
                recurrent_state=recurrent_state,
                conv_state=(conv_state_q, conv_state_k, conv_state_v) if self.use_short_conv else None,
                layer_idx=self.layer_idx,
                offset=q_len
            )
        if self.use_gate:
            g = rearrange(self.g_proj(hidden_states), '... (h d) -> ... h d', d=self.head_v_dim)
            o = self.o_norm(o, g)
        else:
            o = self.o_norm(o)
        o = rearrange(o, 'b t h d -> b t (h d)')
        o = self.o_proj(o)
        if attention_mask is not None:
            o = pad_input(o.squeeze(0), indices, batch_size, q_len)
        return o, None, past_key_values
'''
motivation = '''
**Core Insights:**
- Linear transformers with delta rule (DeltaNet) offer better associative recall capabilities than standard linear transformers by replacing additive updates with delta rule updates
- Existing DeltaNet training algorithms do not parallelize over sequence length and are thus inefficient to train on modern hardware
- A memory-efficient representation using the compact WY representation for computing products of Householder matrices can eliminate the need to materialize hidden states of matrix size at each time step during parallel training
**Method Innovation:**
1. **Reparameterization**: Reparameterize DeltaNet as a matrix-valued RNN whose recurrence is given by a generalized Householder transformation
2. **WY Representation**: Exploit a memory-efficient representation for computing products of Householder matrices, eliminating the need to materialize the hidden states of matrix size at each time step
3. **Chunkwise Parallelization**: Straightforwardly extend the chunkwise parallel strategy for training linear attention models to the DeltaNet case
**Technical Details:**
- DeltaNet update rule: St = St−1 − βt(St−1kt − vt)k⊤t, where βt is the learning rate, St−1kt represents the current prediction, vt is the target value
- UT transform to rewrite operations as matrix multiplications: T[t] = (I + tril(diag(β[t])K[t]K⊤[t], −1))−1 diag β[t]
'''
analysis = '''**Language Modeling Performance:**
- A 1.3B model trained for 100B tokens outperforms recent linear-time baselines such as Mamba and GLA in terms of perplexity and zero-shot performance on downstream tasks
- Hybrid models combining DeltaNet layers with sliding-window attention layers or global attention layers outperform strong transformer baselines
**Synthetic Benchmarks:**
- On MQAR, DeltaNet performs perfectly in the hardest setting and outperforms Mamba in the low-dimension setting
- On MAD benchmark, DeltaNet excels at recall tasks, especially on Fuzzy Recall, though it struggles on the "Memorize" task
**Computational Efficiency:**
- The chunkwise parallel form achieves significant speed-ups against the recurrent form, with greater improvements as sequence length and head dimension increase
- Training speed is close to GLA and significantly faster than Mamba, with all linear-time models outperforming Transformers for longer-sequence training
**Key Limitations Identified:**
1. **State Size Scalability**: At the 1.3B scale, DeltaNet underperforms GLA on recall-intensive tasks due to its poorer state size scalability
2. **Length Generalization**: DeltaNet's length generalization is limited, while GLA and RetNet can extrapolate beyond training length
3. **Computational Overhead**: Training speed still lags behind GLA due to overhead from modeling state-to-state dependencies
**Important Findings:**
- L2 normalization and SiLU activation significantly improve performance compared to the original L1 norm and ELU+1
- Hybrid architecture strategies prove effective, demonstrating the complementary nature of different attention mechanisms
- DeltaNet shows superior performance on recall-intensive tasks compared to other linear recurrent models at comparable state sizes
'''
cognition = '''
'''
# Build the API request data
element_data = {
    "time": current_time,
    "name": "delta_net",
    "result": {
        "train": full_train_data,  # Numeric scores for evaluation
        "test": full_test_data     # Numeric scores for evaluation
    },
    "program": program_code,
    "analysis": analysis,
    "cognition": cognition,
    "log": '',
    "motivation": motivation
}
# Add the data
print(f"🗑️ Deleting all existing data...")
delete_url = f"{API_BASE_URL}/elements/all"
try:
    delete_response = requests.delete(delete_url)
    delete_response.raise_for_status()
    print("✅ Old data deleted successfully!")
except requests.exceptions.RequestException as e:
    print(f"❌ Failed to delete old data: {e}")
    if hasattr(e, 'response') and e.response is not None:
        try:
            error_detail = e.response.json()
            print(f"Error details: {error_detail}")
        except:
            print(f"Response content: {e.response.text}")
print("Starting to add DeltaNet experiment data...")
print(f"Time: {current_time}")
print(f"Target API: {API_BASE_URL}")
success = add_element_via_api(element_data)
if success:
    print("\n🎉 Data addition complete!")
    
    # Verify that the data was added successfully
    print("\nVerifying data...")
    try:
        stats_response = requests.get(f"{API_BASE_URL}/stats")
        if stats_response.status_code == 200:
            stats = stats_response.json()
            print(f"📊 Current database statistics: {stats['total_records']} records")
        else:
            print("Failed to retrieve database statistics")
    except Exception as e:
        print(f"Failed to get statistics: {e}")
    # Adding PUT /candidates/1 command, the add command is incorrect. It should be a POST.
    print("\nAttempting to add index=1 to the candidate set...")
    add_candidate_url = f"{API_BASE_URL}/candidates/1/add"
    try:
        add_response = requests.post(add_candidate_url)
        add_response.raise_for_status()
        add_result = add_response.json()
        print(f"✅ Successfully added index 1 to candidate set: {add_result}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to add to candidate set: {e}")
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_detail = e.response.json()
                print(f"Error details: {error_detail}")
            except:
                print(f"Response content: {e.response.text}")
else:
    print("\n❌ Data addition failed! Please check if the API service is running correctly")