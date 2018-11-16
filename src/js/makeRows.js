const tableStruct = (...keys) => ((...v) => keys.reduce((o, k, i) => {o[k] = v[i]; return o;} , {}));
const rowItem = tableStruct('Line', 'Type', 'Name', 'Condition', 'Value');
var myRows = [];


const pushFunctions = {
    'Program': ProgramParsing,
    'FunctionDeclaration': FunctionParsing,
    'VariableDeclaration': VariableParsing,
    'ExpressionStatement': ExpressionParsing,
    'AssignmentExpression': AssignmentParsing,
    'WhileStatement': WhileParsing,
    'ForStatement': ForParsing,
    'IfStatement': IfParsing,
    'BlockStatement': BlockParsing,
    'ReturnStatement': ReturnParsing
};

const returnFunctions = {
    'Identifier': IdentifierParsing,
    'BinaryExpression': BinaryParsing,
    'Literal': LiteralParsing,
    'UnaryExpression': UnaryParsing,
    'MemberExpression': MemberParsing,
    'AssignmentExpression': AssignmentReturnParsing,
    'VariableDeclaration': VariableReturnParsing,
    'UpdateExpression': UpdateParsing
};


function makeRow(parsedCode){
    if (parsedCode.type in pushFunctions)
        pushFunctions[parsedCode.type](parsedCode);
}

function ProgramParsing(parsedCode){
    parsedCode['body'].forEach(body => makeRow(body));
}

function FunctionParsing(parsedCode) {
    myRows.push(rowItem(parsedCode['loc']['start']['line'], 'function declaration',parsedCode['id']['name'], '',''));
    parsedCode['params'].forEach(param => insertParams(param));
    parsedCode['body']['body'].forEach(body=> makeRow(body));
}

function VariableParsing(parsedCode){
    parsedCode['declarations'].forEach(decler => declaration(decler));
}

function declaration(parsedCode){
    var name = parsedCode['id'];
    if(name != null)
        name = returnFunctions[name.type](name);
    var value = parsedCode['init'];
    if(value != null)
        value = returnFunctions[value.type](value);
    myRows.push(rowItem(parsedCode['loc']['start']['line'], 'variable declaration', name, '', value));
}

function ExpressionParsing(parsedCode){
    if(parsedCode['expression']['type'] === 'AssignmentExpression')
        AssignmentParsing(parsedCode['expression']);
    else if (parsedCode['expression']['type'] === 'UpdateExpression'){
        var name = returnFunctions[parsedCode['expression']['argument'].type](parsedCode['expression']['argument']);
        var ret = UpdateParsing(parsedCode['expression']);
        myRows.push(rowItem(parsedCode['loc']['start']['line'], 'assignment expression', name, '', ret));
    }
}

function AssignmentParsing(parsedCode){
    var left = parsedCode['left'];
    if(left != null)
        left = returnFunctions[left.type](left);
    var value = parsedCode['right'];
    if(value != null)
        value = returnFunctions[value.type](value);
    myRows.push(rowItem(parsedCode['loc']['start']['line'], 'assignment expression', left, '', value));
}

function WhileParsing(parsedCode){
    var test = parsedCode['test'];
    if(test != null)
        test = returnFunctions[test.type](test);
    myRows.push(rowItem(parsedCode['loc']['start']['line'], 'while statement', '', test, ''));
    makeRow(parsedCode['body']);
}

function ForParsing(parsedCode){
    var init = parsedCode['init'];
    if(init != null)
        init = returnFunctions[init.type](init);
    var test = parsedCode['test'];
    if(test != null)
        test = returnFunctions[test.type](test);
    var update = parsedCode['update'];
    if(update != null)
        update = returnFunctions[update.type](update);
    myRows.push(rowItem(parsedCode['loc']['start']['line'], 'for statement', '', init +';' + test + ';' + update, ''));
    makeRow(parsedCode['body']);
}

function IfParsing(parsedCode){
    var test = parsedCode['test'];
    if(test != null)
        test = returnFunctions[test.type](test);
    myRows.push(rowItem(parsedCode['loc']['start']['line'], 'if statement', '', test, ''));
    makeRow(parsedCode['consequent']);
    if(parsedCode['alternate']!=null)
        if(parsedCode['alternate']['type']=== 'IfStatement')
            elseif(parsedCode['alternate']);
        else  makeRow(parsedCode['alternate']);
}

function BlockParsing(parsedCode){
    parsedCode['body'].forEach(body => makeRow(body));
}

function ReturnParsing(parsedCode){
    var value = parsedCode['argument'];
    if(value != null)
        value = returnFunctions[value.type](value);
    myRows.push(rowItem(parsedCode['loc']['start']['line'], 'return statement', '', '', value));
}

function IdentifierParsing(parsedCode){
    return parsedCode['name'];
}

/**
 * @return {string}
 */
function BinaryParsing(parsedCode){
    var left = returnFunctions[parsedCode['left'].type](parsedCode['left']);
    var oper = parsedCode['operator'];
    var right = returnFunctions[parsedCode['right'].type](parsedCode['right']);
    return ''+ left + ' ' + oper + ' ' + right;
}

function LiteralParsing(parsedCode){
    return parsedCode['value'];
}

/**
 * @return {string}
 */
function UnaryParsing(parsedCode){
    var value = parsedCode['argument'];
    if(value != null)
        value = returnFunctions[value.type](value);
    if(parsedCode['prefix'])
        return parsedCode['operator'] + '' + value;
    else return value;
}

/**
 * @return {string}
 */
function MemberParsing(parsedCode){
    var value = parsedCode['object'];
    if(value != null)
        value = returnFunctions[value.type](value);
    var property = returnFunctions[parsedCode['property'].type](parsedCode['property']);
    return '' + value +'[' + property +']';
}

/**
 * @return {string}
 */
function AssignmentReturnParsing(parsedCode){
    var left = parsedCode['left'];
    if(left != null)
        left = returnFunctions[left.type](left);
    var value = parsedCode['right'];
    if(value != null)
        value = returnFunctions[value.type](value);
    return '' + left +parsedCode['operator']+value;
}

function VariableReturnParsing(parsedCode){
    return parsedCode['declarations'].reduce((str, declar) => str + declarationReturn(declar), '');
}

function declarationReturn(parsedCode){
    var name = parsedCode['id'];
    if(name != null)
        name = returnFunctions[name.type](name);
    var value = parsedCode['init'];
    if(value != null) {
        value = returnFunctions[value.type](value);
        return '' + name + '=' + value;
    }
    else
        return name;
}

/**
 * @return {string}
 */
function UpdateParsing(parsedCode){
    var arg = parsedCode['argument'];
    if(arg != null)
        arg = returnFunctions[arg.type](arg);
    if(parsedCode['prefix'])
        return '' + parsedCode['operator'] + arg;
    else
        return '' + arg + parsedCode['operator'];
}

function insertParams(parsedCodeParam)
{
    myRows.push(rowItem(parsedCodeParam['loc']['start']['line'], 'variable declaration', parsedCodeParam['name'],'','' ));
}

function elseif(parsedCode)
{
    var test = parsedCode['test'];
    if(test != null)
        test = returnFunctions[test.type](test);
    myRows.push(rowItem(parsedCode['loc']['start']['line'], 'else if statement', '', test, ''));
    makeRow(parsedCode['consequent']);
    if(parsedCode['alternate']!=null)
        if(parsedCode['alternate']['type'] === 'IfStatement')
            elseif(parsedCode['alternate']);
        else  makeRow(parsedCode['alternate']);
}

function clearMyRows(){
    myRows = [];
}

export {makeRow, myRows, rowItem, clearMyRows};