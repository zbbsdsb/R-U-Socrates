def Deduplication_input(context: str, repeated_motivation: str) -> str:
    return f"""
# Neural Architecture Innovation Diversification Task

## TASK OVERVIEW
**Primary Objective**: Generate breakthrough architectural code that fundamentally differs from repeated design patterns
**Innovation Scope**: Implement paradigm shifts, not incremental variations
**Deliverable Priority**: Revolutionary architecture code implementation (PRIMARY), documentation (SECONDARY)

## REPEATED PATTERN ANALYSIS
### Target for Differentiation:
```
{repeated_motivation}
```

### Pattern Recognition Task:
1. **Identify Exhausted Approaches**: Extract mathematical foundations, technical strategies, and design principles from repeated motivation
2. **Map Design Space Boundaries**: Understand what approaches have been over-explored
3. **Define Orthogonal Directions**: Identify completely different design spaces to explore

## HISTORICAL CONTEXT & EXPERIMENTAL INSIGHTS
{context}

## INNOVATION FRAMEWORK

### Phase 1: Pattern Breaking Analysis
**Required Actions:**
- [ ] **Read Current Architecture**: Use `read_code_file` to examine existing implementation
- [ ] **Extract Repeated Themes**: Identify common mathematical foundations, algorithms, and design patterns
- [ ] **Map Exhausted Spaces**: Catalog approaches that have been over-utilized
- [ ] **Identify Innovation Gaps**: Find unexplored orthogonal design directions

### Phase 2: Orthogonal Innovation Design
**Cross-Disciplinary Exploration Targets:**
- **Mathematical Foundations**: Graph theory, signal processing, information theory, differential geometry, topology
- **Biological Inspiration**: Neuroscience, developmental biology, evolutionary systems, cellular automata
- **Physics-Based Mechanisms**: Thermodynamics, quantum theory, field theory, complex systems, phase transitions
- **Engineering Principles**: Control theory, communication systems, distributed computing, optimization theory
- **Novel Computational Paradigms**: Information geometry, algorithmic information theory, category theory

**Innovation Direction Guidelines:**
- **If attention mechanisms dominate** → Explore recurrent, convolutional, or signal processing alternatives
- **If local processing repeats** → Investigate global, hierarchical, or field-theoretic approaches
- **If static architectures prevail** → Design adaptive, dynamic, or evolutionary systems
- **If linear information flows common** → Explore parallel, circular, or network-based flows
- **If deterministic patterns repeat** → Investigate stochastic, probabilistic, or uncertainty-based approaches

### Phase 3: Implementation Excellence
**CRITICAL IMPLEMENTATION REQUIREMENTS:**

#### Preservation Constraints (NON-NEGOTIABLE):
- **Main Class Name**: MUST remain unchanged - never modify this
- **Standard Parameters**: Preserve d_model, hidden_size, num_heads, expand_k, expand_v, etc.
- **Interface Compatibility**: Maintain exact forward function signature and **kwargs support
- **Computational Complexity**: Ensure sub-quadratic O(N log N) or better performance
- **Processing Pattern**: Implement efficient chunked computation
- **Causal Constraints**: Maintain proper causal information flow

#### Robustness Standards (MANDATORY):
- **Tensor Operations**: Use `einops.rearrange()` for ALL tensor reshaping - NO `.view()` or `.reshape()`
- **Batch Size Independence**: All operations must work with ANY batch size - zero hardcoded assumptions
- **Dynamic Dimension Handling**: Let einops automatically infer dimensions - never manually calculate chunks
- **Runtime Shape Extraction**: Get dimensions from `tensor.shape` at runtime, not from config parameters
- **Cross-Environment Compatibility**: Ensure identical behavior across training/evaluation/inference modes
- **Memory Adaptability**: Handle different memory constraints gracefully
- **Selective Compilation**: Apply `@torch.compile` only to main computational functions

## STRUCTURED EXECUTION PROTOCOL

### Step 1: Architecture Analysis
```
Action: Use read_code_file to examine current implementation
Focus: Understanding existing design patterns and constraints
Output: Clear picture of current architecture and its limitations
```

### Step 2: Innovation Strategy Development
```
Action: Design orthogonal solution based on cross-disciplinary insights
Focus: Creating fundamentally different mechanisms that avoid repeated patterns
Output: Novel architectural concept with clear differentiation rationale
```

### Step 3: Revolutionary Implementation
```
Action: Use write_code_file to implement breakthrough architecture
Focus: Maintaining all constraints while achieving paradigm shift
Output: Working code that represents genuine innovation
Requirements: 
- All tensor operations use einops.rearrange()
- Batch size independent design
- Cross-environment compatibility
- Performance within complexity bounds
```

### Step 4: Innovation Documentation
```
Action: Document the paradigm shift
Focus: Clear explanation of how this differs from repeated patterns
Output: Brief motivation explaining novel principles and breakthrough potential
Format:
- Name: "delta_net_[novel_identifier]" (avoid repeated motivation terminology)
- Motivation: Concise differentiation explanation
```

## SUCCESS VALIDATION CRITERIA
- [ ] **Revolutionary Code Implementation**: Primary deliverable completed with working architecture
- [ ] **Constraint Preservation**: All technical requirements maintained
- [ ] **Robustness Achievement**: einops usage, batch independence, cross-environment compatibility
- [ ] **Genuine Innovation**: Fundamental difference from repeated patterns demonstrated
- [ ] **Breakthrough Potential**: Clear pathway to significant performance improvements
- [ ] **Documentation Quality**: Clear explanation of paradigm shift and novel principles

## CRITICAL REMINDERS
- **Implementation is PRIMARY**: Code creation takes precedence over documentation
- **Paradigm Shift Required**: Avoid variations - create fundamental differences
- **Robustness Non-Negotiable**: All tensor operations must use einops and be batch-size independent
- **Cross-Environment Testing**: Ensure consistent behavior across all execution modes
- **Innovation Focus**: Explore unexplored research foundations for breakthrough potential
    """