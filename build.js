const shell = require('shelljs');
const fs = require('fs');
const _ = require('lodash');

const SRC_DIR = 'src';

const FLAGS = {
    useRegPack: true,
    decompressRegPack: true,
    usePrecisionHeader: true,
};

const shortVarNames = _.range(10, 36)
    .map(x => x.toString(36))
    .filter(x => x !== 'g' && x !== 'a');

const stripComments = js => js
    .replace(/\/\*[^\*]*\*\//g, '')
    .replace(/\/\/.*/g, '');

const minifyPrefixedIdentifiers = (prefix, js) => {
    const vars = _.uniq(js
        .match(new RegExp(`[^a-zA-Z0-9_]${prefix}[a-zA-Z0-9_]+`, 'g'))
        .map(x => x.substr(1)));

    vars.sort((a, b) => b.length - a.length);

    vars.forEach((v, i) => {
        js = js.replace(new RegExp('\\'+v, 'g'), shortVarNames[i]);
    });

    return js;
};

const replaceMacros = code => {
    const lines = code.split('\n').map(x => x.trim());
    const outLines = [];

    const macros = {};
    let curMacroName = null;
    let curMacroBody = '';

    lines.forEach(line => {
        if (curMacroName === null) {
            const match = line.match(/__defMacro\(['"]([^'"]+)['"]/);
            if (match) {
                curMacroName = match[1];
                curMacroBody = '';
            } else {
                outLines.push(line);
            }
        }
        else if (line === ')') {
            macros[curMacroName] = curMacroBody;
            curMacroName = null;
        }
        else {
            curMacroBody += line;
        }
    });

    code = outLines.join('\n');

    for (let k in macros) {
        while (code.indexOf(k) >= 0) {
            code = code.replace(k, macros[k]);
        }
    }

    return code;
};

const getMinifiedShader = path => {
    const SHADER_MIN_TOOL = process.platform === 'win32' ? 'tools\\shader_minifier.exe' : 'mono tools/shader_minifier.exe';
    shell.exec(`${SHADER_MIN_TOOL} --preserve-externals --no-renaming-list main --format none ${path} -o tmp_out.glsl`);
    const result = fs.readFileSync('tmp_out.glsl', 'utf8');
    
    if (path.endsWith('.frag') && FLAGS.usePrecisionHeader) {
        return 'precision highp float;' + result.replace(/highp /g, '');
    }

    return result;
}

const insertShaders = js => {
    while (js.indexOf('__shader(') >= 0) {
        const match = js.match(/__shader\(['"]([^'"]+)['"]\)/);
        const shader = getMinifiedShader(SRC_DIR + '/' + match[1]);
        js = js.replace(/__shader\(['"][^'"]+['"]\)/, "'"+shader+"'");
    }
    
    return js;
};

const removeWhitespace = js => js
    .replace(/[ \t\r\n]+/g, '')
    .replace(/return/g, 'return ')
    .replace(/let/g, 'let ')
    .replace(/newInt/g, 'new Int')
    .replace(/newUint/g, 'new Uint');

const addNewlines = (str, lineLength) => {
    let result = '';
    while (str.length > 0) {
        result += str.substring(0, lineLength) + '\n';
        str = str.substring(lineLength);
    }
    return result;
}

const main = () => {
    let js = fs.readFileSync(SRC_DIR + '/main.js', 'utf8');

    js = stripComments(js);
    js = replaceMacros(js);
    js = removeWhitespace(js);
    js = insertShaders(js);
    js = minifyPrefixedIdentifiers('\\$', js);
    
    if (FLAGS.useRegPack) {
        fs.writeFileSync('tmp_in.js', js);

        console.log('Packing...');
        shell.exec('regpack '+
            '--contextType 1 '+
            '--crushGainFactor 1 '+
            '--crushLengthFactor 0 '+
            '--crushCopiesFactor 0 '+
            '--crushTiebreakerFactor 0 '+
            '--hashWebGLContext true '+
            '--contextVariableName g '+
            '--varsNotReassigned g,a '+
            '--useES6 true ' +
            'tmp_in.js > tmp_out.js'
        );
        console.log('');

        js = fs.readFileSync('tmp_out.js', 'utf8');

        if (FLAGS.decompressRegPack && js.indexOf('eval(_)') >= 0) {
            console.log('Reversing RegPack compression...');
            fs.writeFileSync('tmp_in.js', js.replace('eval(_)', 'console.log(_)'));
            shell.exec('node tmp_in.js > tmp_out.js');
            js = fs.readFileSync('tmp_out.js', 'utf8');
            console.log('');
        }
    }

    const shimHTML = fs.readFileSync(SRC_DIR + '/index.html', 'utf8');

    shell.mkdir('-p', 'docs');

    fs.writeFileSync('docs/a.html',
        shimHTML.replace(/__CODE__[^]*/,'')
        + js.trim()
        + shimHTML.replace(/[^_]*__CODE__/,'')
    );
    
    shell.cd('docs');
    shell.exec('..\\tools\\advzip.exe -q -a -4 ../bundle.zip a.html');
    shell.cd('..');

    console.log('Zipped: ' + fs.statSync('bundle.zip').size + ' / 2048');
    console.log('');
    
    shell.rm('-rf', 'tmp*.*');
}

main();