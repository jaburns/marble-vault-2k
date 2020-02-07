uniform mat4 g;

float seed;
vec2 pos;

// ==============================================================

float rand(vec2 co)
{
    return fract(sin(dot(co,vec2(11.,79.))) * 4e5);
    //return fract(sin(n.x+99.*n.y)*43758.5453123);
    //return fract(sin(dot(co,vec2(12.9898,78.233))) * 43758.5453);
}

// ==============================================================

vec2 writeFloat(float a)
{
    a = (a + 1.) / 2.;
    return vec2(
        floor(a*255.) / 255.,
        fract(255. * a)
    );
}

float readFloat(vec2 a)
{
    return (a.x/255. + a.y/255./255.) * 2. - 1.;
}

// ==============================================================

int drawingFG;

vec3 gnd(vec2 xy, float d, vec3 base)
{
    d = clamp(d, 0., 1.);
    float b = 1. - d;
    float r = 1. - sqrt(1. - b*b);

    // Curve the lookup coordinates around the edge of the surface.
    xy += .2*vec2(-r,r);

    // If we're at the finish line, get the checkerboard color.
    if (drawingFG>0 && xy.x > 19.8*3.5 && xy.x < 20.*3.5) {
        xy = floor(10.*xy);
        return vec3(.2+.8*mod(xy.x + xy.y, 2.));
    }

    // Add some curvature to the stripes.
    xy += .8*sin(.9*xy.yx);

    // Get color of the stripes.
    return base
        * (1.-.05*abs(floor(mod(8.*(xy.x+2.-xy.y),4.))-2.)) // Stripe color
        * (1.-.5*pow(clamp(d+.5,.5,1.),2.));                // Lighting
}

// ==============================================================

float merge(float a, float b)
{
    return -length(min(vec2(a, b), 0.)) + max(min(a, b), 0.);
}

float map(vec2 p)
{
    float weird = abs(seed/1e3);
    float ra = rand(vec2(seed,floor(p.x+ .5)));
    float rb = rand(vec2(seed,floor(p.x+1.5)));
    float rc = rand(vec2(seed,floor(p.x- .5)));
    float oa = rand(vec2(seed,floor(p.x+ .5+9.)))*(.9+weird);
    float ob = rand(vec2(seed,floor(p.x+1.5+9.)))*(.9+weird);
    float oc = rand(vec2(seed,floor(p.x- .5+9.)))*(.9+weird);
    
    if (seed > 0. && p.y + oa > 0.) return -1.;

    vec2 v = p;
    v.x = mod(v.x+.5, 1.)-.5;
    
    float a = length(v+vec2( 0,oa-.5*weird)) - (.7 + .6*ra);
    float b = length(v+vec2(-1,ob-.5*weird)) - (.7 + .6*rb);
    float c = length(v+vec2( 1,oc-.5*weird)) - (.7 + .6*rc);
    
    return min(p.x-.7*p.y-7., merge(merge(a,c),b));
}

vec3 worldColor(vec2 uv, vec3 base)
{
    float d = map(uv);
    return
        d < -.045 ? vec3(0) :
        d < 0. ? vec3(0) :
        gnd(uv, 3.*d, base);
}

// ==============================================================

vec3 hsl2rgb(vec3 c)
{
    return c.z+c.y*(clamp(abs(mod(c.x*6.+vec3(0,4,2),6.)-3.)-1.,0.,1.)-.5)*(1.-abs(2.*c.z-1.));
}

vec3 draw(vec2 coord)
{
    const vec3 i_SKY = vec3(.47,.71,1.);

    float ga = fract(seed*.11);
    vec3 GROUND_A = hsl2rgb(vec3(ga,.57,.45));
    vec3 GROUND_B = hsl2rgb(vec3(fract(ga-.3),.57,.45));
    vec3 BAWL = hsl2rgb(vec3(fract(ga+.5),.57,.45));

    vec2 m = (coord - g[0].xy * .5) / g[0].y;
    m.x += g[0].w;
    m *= 3.5;
    m.y -= .9;

    if (length(m-pos) < .05) {
        m -= pos;
        float x = max((8.*length(m-vec2(.04))) + .9,0.);
        return BAWL/x/x;
    } 

    // 1913

    drawingFG = 1;
    vec3 fc = worldColor(m, GROUND_A);
    drawingFG = 0;
    if (fc == vec3(0)) {
        fc = worldColor(2.*m - 3.*vec2(g[0].w-99.,-.1), GROUND_B);
        if (fc == vec3(0)) {
            fc = worldColor(4.*m - 8.*vec2(g[0].w-99.,0), GROUND_B);
            if (fc == vec3(0)) {
                fc = i_SKY;
            } else {
                fc = mix(fc, i_SKY, .6);
            }
        } else {
            fc = mix(fc, i_SKY, .3);
        }
    }
    return fc;
}

void main()
{
    vec2 coord = gl_FragCoord.xy;
    pos = vec2(readFloat(g[1].xy), readFloat(g[1].zw));
    pos.x += g[3].x;
    pos *= 3.5;

    vec2 vel = vec2(readFloat(g[2].xy), readFloat(g[2].zw));

    int right = int(mod(g[0].z     , 2.));
    int down  = int(mod(g[0].z / 2., 2.));
    seed = floor(g[0].z / 4.);

    int stomped = int(mod(g[3].z,      2.));
    int dashed  = int(mod(g[3].z / 2., 2.));
    int counter = int(g[3].w);

// Rendering

    vec3 za = draw(coord+.5*vec2(-.75, .25));
    vec3 zb = draw(coord+.5*vec2(-.25,-.75));
    vec3 zc = draw(coord+.5*vec2( .25, .75));
    vec3 zd = draw(coord+.5*vec2( .75,-.25));
    gl_FragColor = vec4(.25*(za+zb+zc+zd), 1);

// State update

    if (coord.y < 1. && coord.x < 4.)
    {
        vel.y -= 0.01;
        pos += 0.05 * vel;

        float depth = map(pos);
        vec2 eps = vec2(1e-4, 0);
        vec2 norm = normalize(vec2(
            map(pos - eps.xy) - map(pos + eps.xy),
            map(pos - eps.yx) - map(pos + eps.yx)));

        if (depth >= -.045) {
            counter = 0;

            if (dot(norm, vel) < 0.) {
                pos += norm * (depth + 0.045);
                vec2 tang = vec2(norm.y, -norm.x);
                vel = dot(vel, tang) * tang;
            }
        } else {
            counter++;
            if (counter == 6) {
                stomped = dashed = 0;
            }
            if (stomped + 1 == down) {
                stomped = dashed = 1;
                vel.y = -1.;
            }
            if (dashed + 1 == right) {
                dashed = 1;
                vel.x += .5 - .5*vel.x;
            }
        }

        pos /= 3.5;
        pos.x -= g[0].w;

        gl_FragColor = 
            coord.x < 2. ? vec4(writeFloat(pos.x), writeFloat(pos.y)) : // g[1]
            coord.x < 3. ? vec4(writeFloat(vel.x), writeFloat(vel.y)) : // g[2]
                vec4(ivec4(0, 0, stomped+2*dashed, counter))/255.     ; // g[3]
    }
}