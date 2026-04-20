def Summary_input(motivation: str, analysis: str, cognition: str) -> str:
    return f"""# Experience Synthesis Task

## Experimental Context

### Design Motivation
{motivation}

### Performance Analysis
{analysis}

### Available Research Cognition
{cognition}

## Synthesis Instructions

Your task is to synthesize these experimental results into a comprehensive experience summary that will guide future architectural innovations. Focus on extracting maximum value for the Planner agent.

### Analysis Process:

1. **Performance Pattern Extraction**:
   - Identify specific strengths and weaknesses in the experimental results
   - Trace performance limitations to architectural design choices
   - Highlight consistent patterns across different evaluation metrics
   - Assess whether results align with stated design motivations

2. **Theoretical Validation Assessment**:
   - Evaluate how well the experimental outcomes match theoretical expectations
   - Identify where design hypotheses were confirmed or refuted
   - Assess the effectiveness of specific architectural innovations
   - Determine if complexity/performance trade-offs were optimal

3. **Root Cause Diagnosis**:
   - Pinpoint the fundamental architectural elements limiting performance
   - Identify computational bottlenecks and efficiency issues
   - Assess information flow and causal modeling integrity
   - Evaluate parameter utilization and representational capacity

4. **Research Integration Analysis**:
   - Map observed weaknesses to available research insights that could address them
   - Identify cognitive principles that align with experimental needs
   - Highlight implementation strategies from research that could be beneficial
   - Assess which research directions are most promising for addressing limitations

5. **Innovation Opportunity Identification**:
   - Specify concrete architectural improvements based on the analysis
   - Provide clear guidance on what should be preserved vs. modified
   - Identify breakthrough opportunities that could significantly improve performance
   - Ensure recommendations maintain sub-quadratic complexity requirements

### Output Requirements:

Generate a comprehensive experience summary that includes:

- **Multi-Element Performance Analysis**: Clear identification of consistent patterns, strengths, and weaknesses across experiments
- **Architectural Bottleneck Identification**: Specific pinpointing of design elements that limit performance with supporting evidence
- **Theoretical Consistency Evaluation**: Assessment of how well results align with design motivations and expectations  
- **Research Integration Opportunities**: Clear connections between observed weaknesses and available research insights
- **Causal Modeling Verification**: Confirmation of architectural integrity and identification of any potential issues
- **Innovation Direction Guidance**: Specific, actionable recommendations for architectural evolution
- **Implementation Strategy**: Concrete suggestions for how to address identified limitations while preserving successful elements

Focus on providing the Planner with:
1. **Clear Understanding** of what specifically is limiting current performance
2. **Targeted Solutions** based on available research insights
3. **Preservation Guidance** for successful architectural elements
4. **Innovation Opportunities** with theoretical justification
5. **Implementation Roadmap** for addressing identified issues

The experience should enable the Planner to make informed decisions about architectural evolution while avoiding repeated failures and building on demonstrated successes."""