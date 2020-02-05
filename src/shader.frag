uniform highp mat4 g;

highp vec2 writeFloat(highp float a)
{
    a = (a + 1.) / 2.;
    return vec2(
        floor(a*255.) / 255.,
        fract(255. * a)
    );
}

highp float readFloat(highp vec2 a)
{
    return (a.x/255. + a.y/255./255.) * 2. - 1.;
}

// ==============================================================

const highp vec3 A = vec3(223.0 / 255.0, 61.0 / 255.0, 161.0 / 255.0);
const highp vec3 B = vec3(192.0 / 255.0, 52.0 / 255.0, 133.0 / 255.0);
const highp vec3 C = vec3(166.0 / 255.0, 55.0 / 255.0, 115.0 / 255.0);

highp vec3 STRIPES(highp float i)
{
    i = mod(i, 8.0);
    return i < 1. ? A
        : i < 2. ? B
        : i < 3. ? C
        : i < 4. ? B
        : i < 5. ? A
        : i < 6. ? C
        : i < 7. ? B
        : C;
}
highp vec3 stripes(highp vec2 xy)
{
    highp vec2 uv = mod(xy, vec2(1.0));
    highp float t = 8.0 * (uv.x + 2.0 - uv.y);
    return STRIPES(t + 0.5);
}
highp vec3 gnd(highp vec2 xy, highp float d)
{
    d = clamp(d, 0., 1.);
    highp float one_minus_gnd = 1. - d;
    highp float round_off = 1. - sqrt(1. - one_minus_gnd*one_minus_gnd);
    return stripes(xy + 0.2*vec2(-round_off,round_off)) * pow(clamp(d+.5,.5,1.),2.);
}





highp float rand(highp vec2 co)
{
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

highp float merge(highp float shape1, highp float shape2){
    //return min(shape1, shape2);
    highp vec2 intersectionSpace = vec2(shape1, shape2);
    intersectionSpace = min(intersectionSpace, 0.);
    highp float xx =  length(intersectionSpace);
    highp float simpleUnion = min(shape1, shape2);
    highp float outsideDistance = max(simpleUnion, 0.);
    return -xx + outsideDistance;
}

highp float map(highp vec2 p, highp float seed)
{
    highp float ra = rand(vec2(seed+1.,floor(p.x+ .5)));
    highp float rb = rand(vec2(seed+1.,floor(p.x+1.5)));
    highp float rc = rand(vec2(seed+1.,floor(p.x- .5)));
    
    highp float oa = rand(vec2(seed+2.,floor(p.x+ .5)));
    highp float ob = rand(vec2(seed+2.,floor(p.x+1.5)));
    highp float oc = rand(vec2(seed+2.,floor(p.x- .5)));    
    
    if (p.y + oa > 0.) return -1.;

    highp vec2 v = p;
    v.x = mod(v.x+.5, 1.)-.5;
    
    highp float a = length(v+vec2( 0,oa)) - (.7 + .5*ra);
    highp float b = length(v+vec2(-1,ob)) - (.7 + .5*rb);
    highp float c = length(v+vec2( 1,oc)) - (.7 + .5*rc);
    
    return merge(merge(a,c),b);
}

highp vec3 worldColor(highp vec2 uv, highp float t, highp float seed)
{
//  uv.y -= .9;
//  uv.x += t / 600.;

    highp float y = map(uv, seed);
    return y < -.045 ? vec3(0) : y < 0. ? vec3(0) : gnd(uv, 3.*y);
}

bool collision(highp vec2 pos, highp float t, highp float seed, out highp vec3 colInfo)
{
//  pos.y -= .9;
//  pos.x += t / 600.;

    highp float y = map(pos, seed);

    highp vec2 e = vec2(0.0001, 0);
    highp vec2 n = normalize(vec2(
        map(pos - e.xy, seed) - map(pos + e.xy, seed),
        map(pos - e.yx, seed) - map(pos + e.yx, seed)));

    colInfo = vec3(n, y);

    return y >= -.045;
}

// ==============================================================

highp vec2 reflect2(highp vec2 i, highp vec2 n, highp float mt, highp float mn)
{
    //return reflect(i, n);
    highp vec2 t = vec2(n.y, -n.x);
    highp float normComp = dot(i, n);
    highp float tanComp = dot(i, t);
    return normComp*n*mn + tanComp*t*mt;
}

void main()
{
    highp vec2 coord = gl_FragCoord.xy;
    highp vec2 pos = vec2(readFloat(g[1].xy), readFloat(g[1].zw));
    pos *= 3.5;
    pos.x += (g[0].w-1.) / 40.;

    highp vec2 vel = vec2(readFloat(g[2].xy), readFloat(g[2].zw));
    highp vec3 colInfo;

    bool left  = mod(g[0].z,      2.) > .9;
    bool right = mod(g[0].z / 2., 2.) > .9;
    bool up    = mod(g[0].z / 4., 2.) > .9;
    bool down  = mod(g[0].z / 8., 2.) > .9;
    highp float seed = floor(g[0].z / 16.);

    bool stomped = mod(g[3].z,      2.) > .9;
    bool dashed  = mod(g[3].z / 2., 2.) > .9;
    bool grounded = mod(g[3].z / 4., 2.) > .9;
    highp float counter = g[3].w;

// Rendering

    highp vec2 m = (coord - g[0].xy * .5) / g[0].y;
    highp vec2 mm = m;
    m *= 3.5;
    m.x += g[0].w / 40.;
    m.y -= .9;

    if (length(m-pos) < .05) {
        m -= pos;
        //highp vec3 col = collision(pos, g[0].w, seed, colInfo) ? vec3(1,0,0) : vec3(.714,.376,.706);
        //highp vec3 col = vec3(stomped ? 1. : .5, dashed ? 1. : .5, grounded ? 1. : .5); //  1.-C;
        highp vec3 col = stomped ? vec3(0,1,0) : 1.-C;
        highp float x = max((8.*length(m-vec2(.04))) + .9,0.);
        col *= 1./x/x;
        gl_FragColor = vec4(col,1);
    } else {
        gl_FragColor = vec4(worldColor(m, g[0].w, seed), 1);
        if (gl_FragColor.xyz == vec3(0)) {
            gl_FragColor = vec4(.2*worldColor(2.*m - vec2(g[0].w / 30.,0), g[0].w, 2.*seed), 1);
        }
    }

    gl_FragColor.xyz *= 1.-smoothstep(16./10.*.5 - .05, 16./10.*.5 + .05, abs(mm.x));

// State update

    if (coord.y < 1. && coord.x < 4.)
    {
        vel.y -= 0.01;
        pos += 0.05 * vel;

        if (collision(pos, g[0].w, seed, colInfo)) {
            if (!grounded) {
            }
            grounded = true;

            if (dot(colInfo.xy, vel) < 0.) {
                pos += colInfo.xy * (colInfo.z + 0.045);
                vel = reflect2(vel, colInfo.xy, 1., 0.);
            }
        } else if (grounded) {
            counter++;
            if (counter > 5.) {
                grounded = false;
                stomped = false;
                dashed = false;
                counter = 0.;
            }
        }
        if (!stomped && down) {
            stomped = true;
            vel.y = -1.;
        }
        if (!stomped && right) {
            stomped = true;
            vel.x += .5 - .5*vel.x;
        }

        gl_FragColor = vec4(writeFloat(seed/999.), ((stomped?1.:0.)+(dashed?2.:0.)+(grounded?4.:0.))/255., counter/255.);
        if (coord.x < 2.) {
            pos.x -= g[0].w / 40.;
            pos /= 3.5;
            gl_FragColor = vec4(writeFloat(pos.x), writeFloat(pos.y)); // g[1]
        }
        else if (coord.x < 3.) {
            gl_FragColor = vec4(writeFloat(vel.x), writeFloat(vel.y)); // g[2]
        }
    }
}