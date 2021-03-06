const constTokens = require("../tokenizer/constants");
const constParser = require("./constants");
const helper = require("./helper");

exports.create = (type, tokens, start) => {
    switch (type) {
        case constParser.expressionImport:
            return importLibrary(tokens, start);
        case constParser.expressionDeclarationFunction:
            return declarationFunction(tokens, start);
        case constParser.expressionDeclarationVariable:
            return declarationVariable(tokens, start);
        case constParser.expressionFunctionCall:
            return callFunction(tokens, start);
        case constParser.expressionVariableCall:
            return callVariable(tokens, start);
    }
}

function next(tokens, start) {
    return helper.skipBlank(tokens, start + 1, 1)
}

function importLibrary(tokens, start) {
    let indexNext = next(tokens, start);
    if (tokens[indexNext].type != constTokens.typeWord) throw constParser.errorImport;
    const lib = tokens[indexNext].value.match(/<[a-zA-z0-9]+.h>/g);
    if (lib.length == 0) throw constParser.errorImport;

    return {
        type: constParser.expressionImport,
        end: indexNext,
        body: tokens.slice(start, indexNext - start + 1)
    }
}

function callFunction(tokens, start) {
    const callTo = tokens[start].value;
    let indexParam = next(tokens, next(tokens, start));
    while (tokens[indexParam] != undefined && tokens[indexParam].type != constTokens.symboleCloseParenthese) {
        if (tokens[indexParam].type != constTokens.symboleEndInstruct) {
            indexParam++;
        } else throw constParser.errorCall;
    }
    const end = next(tokens, next(tokens, indexParam)) + 1;
    return {
        type: constParser.expressionFunctionCall,
        name: callTo,
        body: tokens.slice(start, end),
        end: end - 1
    };
}

function callVariable(tokens, start) {
    return {};
}

function declarationFunction(tokens, start) {
    const indent = helper.getIndent(tokens, start);
    const nextType = next(tokens, start);
    const nameFunc = next(tokens, start);
    const openPar = next(tokens, nameFunc);
    const args = helper.getArgs(tokens, openPar);
    const return_type = tokens.slice(indent, nextType);
    const closeBracket = tokens.findIndex(element => element.type == constTokens.symboleCloseBrackets);
    return {
        type: constParser.expressionDeclarationFunction,
        header: {
            return_type: return_type,
            name: tokens.slice(nextType, openPar),
            arguments: args.args,
        },
        explicite_return: return_type.filter(token => token.type == constTokens.typeWord)[0].value,
        body: [],
        start: args.end,
        end: next(tokens, closeBracket)
    }
}

function declarationVariable(tokens, start) {
    let indexName = next(tokens, start);
    let indexEqual = next(tokens, indexName);
    let indexValue = next(tokens, indexEqual);
    let value = null;
    let type = null;
    let end = null;

    const match = tokens[start].value.match(/(\b(char\*)|\b(int)\b|\bfloat\b)/gi);
    if (match == null) {
        throw constParser.errorDeclaration;
    }

    switch (match[0]) {
        case "char*":
            if (tokens[indexValue].type == constTokens.symboleQuotationMark) {
                const objectString = helper.searchString(tokens, indexValue);
                
                value = objectString.value;
                type = constTokens.typeChar;
                end = next(tokens, objectString.end);
            } else throw constParser.errorMissingQuotationMark;
            
            break;
        case "int":
            if (tokens[indexValue].type == constTokens.typeNumber) {
                value = tokens[indexValue].value;
                type = constTokens.typeNumber;
                end = next(tokens, indexValue);
            } else throw constParser.errorType;
            break;
        default:
            throw constParser.errorDeclaration;
    }
    end = helper.nextNewLine(tokens, next(tokens, end)) + 1;
    return {
        type: constParser.expressionDeclarationVariable,
        typeVariable: type,
        value: value,
        body: tokens.slice(start, end),
        end: end - 1
    };
}