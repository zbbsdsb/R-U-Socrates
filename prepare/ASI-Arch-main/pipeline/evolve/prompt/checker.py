def CodeChecker_input(motivation: str) -> str:
    return f"""Check the implemented code for critical issues and fix them if found.

## Motivation (for context)
{motivation}

## YOUR CHECKING TASK

Perform these checks IN ORDER:

### 1. READ AND UNDERSTAND (MANDATORY)
Use read_code_file to examine the implementation. Understand what the code is trying to achieve based on the motivation.

### 2. STRICT CHECKS - MUST FIX IF FOUND

**A. Mask Correctness Check** 🔴
Examine all masking operations:
- Look for attention masks, causal masks, or any position-based masking
- Verify mask shape matches tensor dimensions
- Check mask is applied BEFORE softmax or similar operations
- Ensure mask prevents position i from seeing positions > i
- Common issue: mask applied after normalization

**B. Complexity Analysis** 🔴
Trace through the computational flow:
- Identify all tensor operations and their complexities
- Look for any dot products between sequences (O(n²))
- Verify chunking is used for any potentially quadratic operations
- Check hidden quadratic costs in seemingly linear operations
- Common issue: full attention without chunking

**C. Chunkwise Implementation** 🔴
Verify efficient chunk processing:
- Check if operations are performed in chunks
- Verify chunk_size is properly extracted and used
- Ensure no full-sequence operations that could be chunked
- Common issue: processing entire sequence at once

### 3. CRITICAL CHECK - BATCH SIZE INDEPENDENCE

**D. Dynamic Shape Handling** 🟡
This is CRITICAL - check for batch size dependencies:
- Search for ANY hardcoded dimensions
- Check position embedding creation - must use actual sequence length from input
- Verify all tensor operations use dynamic shapes
- Specifically check for:
  * Position embeddings created with fixed sizes instead of actual tensor dimensions
  * Any tensor creation with hardcoded shape values
  * Operations that assume specific batch/sequence/head dimensions
  * Incorrect handling of padded vs original lengths
  * Broadcasting operations that fail with different input shapes
- The code MUST work with batch_size=1, 4, 32, or any other value

### 4. FLEXIBLE CHECKS - PRESERVE INNOVATION

**E. Logic Validation** 🟢
Assess architectural logic:
- Is the approach theoretically plausible?
- Are tensor operations mathematically sound?
- Does it maintain gradient flow?
- BE LENIENT: Novel approaches may seem unusual but work

### 5. DECISION AND ACTION

IF any issues found in STRICT or CRITICAL checks:
1. Use write_code_file to save the FIXED version
2. Preserve the original innovation while fixing issues
3. Set success=False
4. Explain what was fixed in error field

IF no issues or only minor logic concerns:
1. Set success=True
2. Leave error empty or note minor concerns

## Common Fixes for Dynamic Shape Issues

**Position Embedding Fix**:
```python
# Before (wrong - assumes fixed sequence length)
if rotary_emb is not None:
    rotary_emb = self.build_rotary_emb(seq_len=q.shape[1], d=d_rot, device=q.device)
# After (correct - but check where q.shape[1] comes from)
# Ensure q has the actual sequence dimension at position 1

# Before (wrong - creates embeddings before padding)
rotary_emb = self.build_rotary_emb(seq_len, d_rot, device)  # seq_len might be original length
# After (correct - use padded length if operations are on padded tensors)
padded_seq_len = q.shape[2]  # or wherever the sequence dimension is
rotary_emb = self.build_rotary_emb(padded_seq_len, d_rot, device)
```

**Tensor Creation Fix**:
```python
# Before (wrong - hardcoded dimensions)
mask = torch.ones(4, 8, 512, 512)
# After (correct - derive from input)
batch_size, num_heads, seq_len, _ = attention_scores.shape
mask = torch.ones(batch_size, num_heads, seq_len, seq_len)
```

**Broadcasting Fix**:
```python
# Before (wrong - incompatible shapes for broadcasting)
# rotary_emb: (original_len, d) but q: (batch, head, padded_len, d)
q_rot * cos  # This fails if original_len != padded_len

# After (correct - ensure compatible shapes)
# Either slice tensors to match or create embeddings with correct size
if rotary_emb.shape[0] != q.shape[2]:
    rotary_emb = self.build_rotary_emb(q.shape[2], d_rot, device)
```

**Padding Handling Fix**:
```python
# Before (wrong - confuses padded and original lengths)
o = o[:, :, :original_len]  # But o might have different padding

# After (correct - track lengths properly)
if pad_len > 0:
    o = o[:, :, :l]  # where l is the original length before padding
```

Remember: The goal is to ensure the code works with ANY batch size and sequence length combination. Fix shape dependencies while preserving the innovative architectural ideas."""