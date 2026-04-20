def Motivation_checker_input(context: str, motivation: str) -> str:
    return f"""
# Linear Attention Research Motivation Duplication Analysis

## TASK OVERVIEW
**Objective**: Determine if the current motivation duplicates any existing research directions
**Domain**: Linear Attention Research  
**Decision Threshold**: Conservative (high bar for marking duplicates)

## TARGET MOTIVATION FOR ANALYSIS
```
{motivation}
```

## HISTORICAL RESEARCH CONTEXT
{context}

## STRUCTURED ANALYSIS FRAMEWORK

### Step 1: Core Component Extraction
From the target motivation, identify:
- **Primary Problem**: What specific issue is being addressed?
- **Technical Approach**: What method/technique is proposed?
- **Research Scope**: What are the boundaries and objectives?
- **Novel Contribution**: What new insight or improvement is claimed?

### Step 2: Systematic Comparison Protocol
For each historical motivation, evaluate:
1. **Problem Alignment**: Does it address the identical core problem?
2. **Approach Similarity**: Is the technical solution fundamentally the same?
3. **Scope Overlap**: Do research boundaries and objectives completely overlap?
4. **Contribution Redundancy**: Would this represent the same research contribution?

### Step 3: Duplication Decision & Index Tracking
**Mark as DUPLICATE only if ALL criteria are met:**
- [ ] Identical core technical problem
- [ ] Same fundamental solution approach  
- [ ] Complete scope and objective overlap
- [ ] Equivalent research contribution

**When marking as DUPLICATE:**
- **MUST record the specific index number(s)** of the duplicate motivation(s)
- **MUST include index references** in the reasoning explanation

**Mark as NON-DUPLICATE if ANY differentiation exists:**
- [ ] Different linear attention aspects (efficiency/accuracy/scalability/interpretability)
- [ ] Different application domains or use cases
- [ ] Different technical approaches to similar problems
- [ ] Different computational constraints or hardware focus
- [ ] Complementary or incremental research directions
- [ ] Different evaluation criteria or success metrics

## ANALYSIS GUIDELINES

### Research Context Awareness
- Linear attention is a broad field with legitimate research diversity
- Surface-level keyword similarity ≠ duplication
- Building upon prior work ≠ duplicating prior work
- Incremental improvements are valid research contributions

### Decision Principles
- **Conservative Bias**: When uncertain, favor non-duplicate classification
- **Specificity Focus**: Look for concrete technical overlaps, not general themes
- **Intent Recognition**: Consider underlying research goals and motivations
- **Innovation Space**: Preserve legitimate research variation and exploration

## OUTPUT REQUIREMENTS
Provide structured reasoning that includes:
1. **Core Elements**: Summary of target motivation's key components
2. **Comparison Results**: Specific findings from historical motivation analysis
3. **Decision Rationale**: Clear explanation of duplicate/non-duplicate determination
4. **Duplicate Identification**: **If duplicates found, MUST specify the exact index numbers of all duplicate motivations**
5. **Supporting Evidence**: Concrete examples supporting the decision

### Critical Output Note:
- **is_repeated**: Boolean indicating if any duplicates were found
- **repeated_index**: List of integer indices for ALL identified duplicate motivations (empty list if no duplicates)
- **judgement_reason**: Detailed explanation of the decision with specific index references when applicable
    """
