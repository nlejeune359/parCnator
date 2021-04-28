const constTokens = require("../tokenizer/constants");
const constParser = require("./constants");
const helper = require("./helper");


function skipBlank(tokens, start, step) {
    if(tokens[start].type == constTokens.symboleBlank) {
        return skipBlank(tokens, start + step, step);
    }
    return start;
}

exports.create = (type, tokens, start) => {
    switch (type) {
        case constParser.expressionFuncCall:
            return objectMethodCall(tokens, start);
        case constParser.expressionDeclaration:
            return variableDeclaration(tokens, start);
        case constParser.expressionAffectation:
            return variableAffectation(tokens, start);
        case constParser.expressionImport:
            return importLibrary(tokens, start);
    }
}

function importLibrary(tokens, start) {
    let next = skipBlank(tokens, start + 1, 1);

    if (tokens[next].type != constTokens.typeWord) throw constParser.errorImport;
    const lib = tokens[next].value.match(/<[a-zA-z0-9]+.h>/g);
    if(lib.length == 0) throw constParser.errorImport;

    let body = [{type: constTokens.symboleInclude}];
    for (let i = 0; i < next - start - 1; i++) {
        body.push({type: constTokens.symboleBlank})
    }
    body.push({type: constTokens.typeWord, value: lib[0]})

    return {
        type: constParser.expressionImport,
        end: next,
        body
    }   
}

function objectMethodCall(tokens, start) {
    let funcName = tokens[start].value;
    let goToPar = skipBlank(tokens, start + 1, 1); 
    let arguments = helper.searchArgs(tokens, goToPar);
    
    return { 
        type: constParser.expressionFuncCall, 
        funcName: funcName, 
        arguments: arguments.args, 
        end: arguments.end 
    };
}

function variableDeclaration(tokens, start) {
    next = skipBlank(tokens, start + 1, 1);
    

    let variableName = tokens[next].value;
    return { type: constParser.expressionDeclaration, variableName: variableName };
}

function variableAffectation(tokens, start) {
    const previous = skipBlank(tokens, start - 1, -1)
    if (tokens[previous].type != constTokens.typeWord) throw constParser.errorMissingWord;
    
    let variableName = tokens[previous].value;

    let variableValue = null;
    let next = skipBlank(tokens, start + 1, 1)
    
    if (tokens[next].type == constTokens.typeNumber) {
        variableValue = tokens[next];
    } else if (tokens[next].type == constTokens.symboleQuotationMark) {
        variableValue = helper.searchString(tokens, next);
    }
    return { type: constParser.expressionAffectation, variableName: variableName, variableValue: variableValue };
}