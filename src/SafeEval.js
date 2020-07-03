
/*
 * The name is a bit misleading since this does not do an eval.
 *
 * What it does do is evaluate a simple string to confirm that it fits
 * the following pattern:
 * 
 *   operand1 operator operand2
 * 
 * where:
 * operator is one of: ==, >, <, >=, <=, !=
 * If operands are both numbers, then it performs numeric comparisons
 * Whitespace is ignored around the operator.
 * 
 * This allows simple evaluations without having to use eval or any
 * similar approach. Clearly, it is not as powerful, but also not as
 * vulnerable.
 */
module.exports = class SafeEval {
    static re = /(?<operand1>.*?)\s*(?<operator>==|>=|>|<=|<|!=)\s*(?<operand2>.*)/;

    static evaluate(expression) {
        const result = SafeEval.re.exec(expression);
        if (!result) {
            return false;
        }

        const numericOperand1 = Number(result.groups.operand1);
        const numericOperand2 = Number(result.groups.operand2);
        if (!isNaN(numericOperand1) && !isNaN(numericOperand2)) {
            return SafeEval._compare(numericOperand1, result.groups.operator, numericOperand2);
        } else {
            return SafeEval._compare(result.groups.operand1, result.groups.operator, result.groups.operand2);
        }
    }

    static _compare(operand1, operator, operand2) {
        switch (operator) {
            case '==':
                return operand1 == operand2;
            case '>':
                return operand1 > operand2;
            case '>=':
                return operand1 >= operand2;
            case '<':
                return operand1 < operand2;
            case '<=':
                return operand1 <= operand2;
            case '!=':
                return operand1 != operand2;
        }
    }
}