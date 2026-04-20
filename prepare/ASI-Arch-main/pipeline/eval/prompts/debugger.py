def Debugger_input(motivation: str, previous_error: str) -> str:
    return f"""# Debug Training Error

## Design Motivation (Must Preserve)
{motivation}

## Training Error Log (Last Few Hundred Lines)
{previous_error}

## Task
Analyze the training error log, read the architecture code, identify the issue, and fix it with minimal changes. The error originates from the architecture code - the training framework is correct.

## Error Analysis Guidelines:
- **Filter framework noise**: Ignore training framework addresses, paths, and irrelevant logs
- **Extract core error**: Find the actual error message that indicates the problem
- **Identify error type**: Determine if it's a timeout/performance issue, runtime crash, or other failure
- **Focus on architecture**: The root cause is in the target code file, not the framework

## Key Constraints:
- **Keep class name "DeltaNet"** - never change this
- **NEVER delete @torch.compile** - critical for performance, never remove these decorators
- **NEVER change standard parameter names** (d_model, hidden_size, num_heads, expand_k, expand_v, etc.)
- **Preserve architectural design intent** - maintain the core motivation and algorithm
- **Make minimal changes** - only fix what's necessary to resolve the error

## Fix Strategy Based on Error Type:

### For Timeout/Performance Issues:
- **Identify complexity bottlenecks**: Look for O(N²) or higher operations
- **Optimize nested loops**: Reduce loop complexity while preserving functionality  
- **Improve chunking**: Ensure efficient chunked processing patterns
- **Eliminate redundant computation**: Remove unnecessary repeated operations
- **Maintain sub-quadratic complexity**: Ensure O(N log N) or better scaling

### For Runtime Crashes:
- **Fix tensor shape mismatches**: Correct dimensions and broadcasting
- **Resolve device issues**: Ensure proper CUDA/CPU placement
- **Handle numerical instability**: Add safeguards for NaN/infinity
- **Fix interface errors**: Correct function signatures and parameters

## Process:
1. **Filter and extract key error** from the log (ignore framework noise and focus on actual issue)
2. **Use read_code_file** to examine the architecture implementation
3. **Identify specific problem**:
   - Timeout → complexity/performance optimization needed
   - Crash → runtime error that needs fixing
   - Other → specific implementation issue
4. **Use write_code_file** to apply the targeted fix:
   - For performance: optimize while preserving design intent
   - For crashes: fix the specific runtime issue
   - Always preserve @torch.compile and class names
5. **Report what was changed** and why

## Critical Reminders:
- **Framework is correct** - don't blame training setup, focus on architecture code
- **@torch.compile must stay** - provides major speedup, never remove
- **Preserve design motivation** - fix implementation issues without changing the core algorithm
- **Sub-quadratic complexity required** - optimize any operations that scale poorly

Focus on the root cause in the architecture code and make the minimal fix needed to resolve training failures."""
