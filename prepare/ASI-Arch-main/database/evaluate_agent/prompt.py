def model_judger_input(element) -> str:
    return f"""# Model Judgement Task

## Baseline Models Reference

### 1. Delta Net (Score: 5/10)
- Basic delta rule architecture
- O(n) computational complexity
- Proper causal masking for decoder architecture
- Training Loss
step,100,200,300,400,500,600,700,800,900,1000,1100,1200,1300,1400,1500,1600,1700,1800,1900,2000
loss,10.2629,8.9712,7.6769,6.9779,6.5788,6.2249,6.0558,5.8544,5.7071,5.5044,5.3517,5.2153,5.1558,4.9783,4.9156,4.9054,4.7193,4.6739,4.6408,4.5787
- Evaluation Results
Model,ARC Challenge,ARC Easy,BoolQ,FDA,HellaSwag,LAMBDA OpenAI,OpenBookQA,PIQA,Social IQA,SQuAD Completion,SWDE,WinoGrande,Average
delta_net,0.168,0.324,0.364,0.000,0.296,0.002,0.136,0.526,0.354,0.002,0.008,0.504,0.224

### 2. Gated Delta Net (Score: 10/10)
- main insight method is the Gated Delta Rule, which cleverly combines two complementary memory management mechanisms. Here's a summary of the core insights:
Core Insight
The key insight of the paper is that gating enables rapid memory erasure while the delta rule facilitates targeted updates . 
Specifically:
Gating mechanism advantage: Enables rapid clearing of outdated or irrelevant information by setting αt → 0
Delta rule advantage: Facilitates selective updates of specific content without affecting other information by setting αt → 1

Method Design
Based on this insight, the paper proposes the Gated Delta Rule:
St = St−1 (αt(I − βtktk⊺t)) + βtvtk⊺t 
Where:
αt ∈ (0,1) is a data-dependent gating term that controls state decay
βt ∈ (0,1) is the writing strength that controls new information writing
- Improved version with gating mechanism
- Maintains O(n) complexity
- Enhanced representation learning through gates
- Training Loss
step,100,200,300,400,500,600,700,800,900,1000,1100,1200,1300,1400,1500,1600,1700,1800,1900,2000
loss,10.0878,8.7382,7.4566,6.6565,6.2449,5.8960,5.7123,5.5010,5.3310,5.1518,5.0055,4.8970,4.8639,4.6856,4.6380,4.6444,4.4774,4.4493,4.4186,4.3772
- Evaluation Results
Model,ARC Challenge,ARC Easy,BoolQ,FDA,HellaSwag,LAMBDA OpenAI,OpenBookQA,PIQA,Social IQA,SQuAD Completion,SWDE,WinoGrande,Average
gated_delta_net,0.168,0.374,0.370,0.000,0.282,0.002,0.144,0.562,0.350,0.004,0.002,0.456,0.226

## New Model Architecture to Evaluate

### Model Name: {element.name}

### Architecture Details:
'''python
{element.program}
'''

### Motivation:
{element.motivation}

### Training Performance:
{element.result['train']}

### Evaluation Results:
{element.result['test']}

## Evaluation Criteria and Scoring Framework

### 1. Performance Improvement (30% weight)
Compare against Delta Net baseline (final loss 4.5787, avg score 0.224):
- **Training Loss**: How much does final training loss improve?
- **Evaluation Score**: How much does average evaluation score improve?
- **Convergence Speed**: Does the model converge faster or slower?

Performance Score Guidelines:
- **1-2**: Significantly worse performance than Delta Net (>5% degradation)
- **3-4**: Slightly worse performance than Delta Net (1-5% degradation)  
- **5**: Similar performance to Delta Net (±1%)
- **6**: Minor improvement over Delta Net (1-3% improvement)
- **7**: Moderate improvement over Delta Net (3-7% improvement)
- **8**: Good improvement over Delta Net (7-15% improvement)
- **9**: Significant improvement over Delta Net (15-25% improvement)
- **10**: Exceptional improvement approaching Gated Delta Net (>25% improvement)

### 2. Architectural Innovation (25% weight)
Assess the novelty and technical merit of the approach:
- **Meaningful Innovation**: Does it address specific limitations of Delta Net?
- **Technical Soundness**: Is the architectural change theoretically justified?
- **Implementation Quality**: Is the code clean and efficient?

Innovation Score Guidelines:
- **1-3**: Trivial changes (parameter tuning, simple modifications)
- **4-5**: Minor architectural adjustments (adding layers, changing activations)
- **6-7**: Moderate innovations (new attention mechanisms, novel gating)
- **8-9**: Significant innovations (new mathematical formulations, creative solutions)
- **10**: Breakthrough innovations (fundamentally new approaches)

### 3. Complexity and Efficiency (45% weight)
Evaluate computational and implementation complexity:
- **Time Complexity**: O(n) optimal, O(n log n) acceptable, O(n²) poor
- **Space Complexity**: Memory efficiency compared to Delta Net
- **Implementation Complexity**: Code readability and maintainability

Complexity Score Guidelines:
- **1-3**: O(n²) complexity or significantly increased memory usage
- **4-5**: O(n log n) complexity or moderately increased complexity
- **6-7**: O(n) complexity but with some overhead compared to Delta Net
- **8-9**: O(n) complexity with similar or better efficiency than Delta Net
- **10**: O(n) complexity with improved efficiency

## Scoring Instructions

Calculate weighted score: (Performance × 0.3) + (Innovation × 0.25) + (Complexity × 0.45)

**Be strict and discriminating in your evaluation.** Most Delta Net variants should score in the 4-7 range unless they show clear, measurable improvements. Reserve scores 8+ for genuinely superior architectures.

**Quantitative Analysis Required**: 
- Calculate exact percentage improvements/degradations in training loss and evaluation metrics
- Compare final training loss and convergence patterns
- Analyze each benchmark score individually

**Expected Score Distribution for Delta Net Variants**:
- 60% of models: 4-6 (minor variations with limited impact)
- 30% of models: 7-8 (meaningful improvements)  
- 10% of models: 9-10 (exceptional innovations approaching Gated Delta Net)

Provide detailed quantitative reasoning for your score, including specific numerical comparisons."""
