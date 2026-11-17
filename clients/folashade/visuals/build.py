import os
T='#C95629';TD='#9E3F1C';SAND='#F1DCCD';CREAM='#FBF7F2';INK='#1A1512'
def pat(c1,c2,c3,op=1,size=200):
    import urllib.parse
    def ring(cx,cy,r): return f"<circle cx='{cx}' cy='{cy}' r='{r}' fill='none' stroke='{c1}' stroke-width='{r*0.22}'/><circle cx='{cx}' cy='{cy}' r='{r*0.62}' fill='none' stroke='{c2}' stroke-width='{r*0.2}'/><circle cx='{cx}' cy='{cy}' r='{r*0.26}' fill='{c3}'/>"
    svg=f"<svg xmlns='http://www.w3.org/2000/svg' width='{size}' height='{size}' opacity='{op}'>{ring(size*.25,size*.25,size*.2)}{ring(size*.75,size*.75,size*.11)}</svg>"
    return "url(data:image/svg+xml,"+urllib.parse.quote(svg,safe="")+")"
CSS=f"""
@font-face{{font-family:FSerif;src:url(node_modules/@fontsource/dm-serif-display/files/dm-serif-display-latin-400-normal.woff2)}}
@font-face{{font-family:FSerif;font-style:italic;src:url(node_modules/@fontsource/dm-serif-display/files/dm-serif-display-latin-400-italic.woff2)}}
@font-face{{font-family:FSans;font-weight:400;src:url(node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2)}}
@font-face{{font-family:FSans;font-weight:600;src:url(node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2)}}
@font-face{{font-family:FSans;font-weight:700;src:url(node_modules/@fontsource/inter/files/inter-latin-700-normal.woff2)}}
*{{box-sizing:border-box;margin:0;padding:0}} body{{font-family:FSans;-webkit-font-smoothing:antialiased}}
.c{{position:relative;overflow:hidden;width:1080px;height:1350px;padding:150px 96px 110px}}
.cream{{background:{CREAM};color:{INK}}} .ink{{background:{INK};color:{CREAM}}} .terra{{background:{T};color:{CREAM}}}
.bg{{position:absolute;inset:0}} .z{{position:relative}}
.band{{position:absolute;left:0;right:0;top:0;height:56px;background:{INK} {pat(T,SAND,T,1,112)} ;background-size:112px 112px;background-position:0 -28px}}
.band.b{{top:auto;bottom:0}}
.num{{font-family:FSerif;font-size:150px;line-height:1;color:{T}}}
.eye{{font-size:22px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;margin:34px 0 26px;color:{TD}}}
h1{{font-family:FSerif;font-weight:400;font-size:96px;line-height:1.08;letter-spacing:-.01em}}
p{{font-size:40px;line-height:1.5;margin-top:44px;max-width:860px}} b{{font-weight:700}}
.foot{{position:absolute;left:96px;right:96px;bottom:96px;display:flex;justify-content:space-between;align-items:center;font-size:20px;font-weight:700;letter-spacing:.18em}}
.foot img{{height:34px}}
.pill{{display:inline-block;border-radius:999px;padding:22px 40px;font-weight:700;font-size:30px}}
ul{{list-style:none;margin-top:44px}} li{{font-family:FSerif;font-style:italic;font-size:52px;padding-left:28px;border-left:6px solid {T};margin:22px 0}}
"""
def page(name,w,h,body,extra=''):
    open(name+'.html','w').write(f"<!doctype html><meta charset=utf-8><style>{CSS}{extra}</style><body style='width:{w}px;height:{h}px'>{body}")
darkpat=f"background:{pat(T,TD,T,.34,360)};background-size:360px 360px"
terrapat=f"background:{pat('#D9703F',TD,'#E08A5E',.55,360)};background-size:360px 360px"
foot=lambda n,word='word.png',col=TD: f"<div class='foot' style='color:{col}'><img src='{word}'><span>{n} / 6</span></div>"
page('wax-1',1080,1350,f"""<div class='c ink' style='padding-top:110px'><div class='bg' style="{darkpat}"></div><div class='bg' style='background:linear-gradient(180deg,rgba(26,21,18,.35),rgba(26,21,18,.9) 55%)'></div>
<div class='z'><img src='full_cream.png' style='height:150px'></div>
<div class='z' style='position:absolute;left:96px;right:96px;bottom:250px'><div class='eye' style='color:{T};filter:brightness(1.25)'>Histoire du wax · 1/6</div>
<h1 style='font-size:112px'>Tu portes du wax…<br><i style='color:{SAND}'>mais connais-tu son histoire?</i></h1></div>
<div class='z' style='position:absolute;left:96px;bottom:110px;font-size:32px;font-weight:600'>Glisse pour la découvrir &nbsp;→</div></div>""")
def std(n,i,eye,h,body,cls='cream'):
    terra=cls=='terra'
    page(f'wax-{i}',1080,1350,f"""<div class='c {cls}'>{'' if terra else "<div class='band'></div>"}{"<div class='band b'></div>" if terra else ''}
<div class='num' style='{"color:"+SAND if terra else ""}'>{n}</div><div class='eye' style='{"color:"+SAND if terra else ""}'>{eye}</div><h1>{h}</h1>{body}
{foot(i,'word_cream.png' if terra else 'word.png',SAND if terra else TD).replace("bottom:96px","bottom:"+("120px" if terra else "96px")) if not terra else "<div class='foot' style='bottom:120px;color:"+SAND+"'><img src='word_cream.png'><span>"+str(i)+" / 6</span></div>"}</div>""")
std('01',2,'Indonésie · depuis des siècles','Tout commence avec le batik de Java.',"<p>Les artisanes javanaises dessinent sur le coton avec de la <b>cire chaude</b>, puis trempent le tissu dans la teinture. La cire protège le motif.</p><p>En anglais, cire se dit <b>«&nbsp;wax&nbsp;»</b>. Le nom vient de là.</p>")
std('02',3,'Pays-Bas · XIX<sup>e</sup> siècle','Des usines européennes imitent le batik.',"<p>Des fabricants néerlandais reproduisent la technique à la machine. Les imperfections, les fameuses <b>craquelures</b>, rendent chaque pièce un peu unique.</p><p>Mais en Indonésie, ce tissu industriel ne séduit pas.</p>")
std('03',4,'Afrique de l\'Ouest · fin du XIX<sup>e</sup>','Le wax trouve sa vraie maison.',"<p>Arrivé par les ports de la Côte de l'Or (l'actuel Ghana), il est adopté, puis réinventé. Au Togo, les commerçantes surnommées <b>«&nbsp;Nana&nbsp;Benz&nbsp;»</b> en font un empire.</p><p>Les couleurs et les motifs deviennent africains.</p>",'terra')
std('04',5,'Un tissu qui parle','Chaque motif a un nom.',"<p>Les femmes s'en servent pour envoyer des messages, sans dire un mot. Quelques noms célèbres :</p><ul><li>« L'œil de ma rivale »</li><li>« Si tu sors, je sors »</li><li>« Mon mari est capable »</li></ul>")
page('wax-6',1080,1350,f"""<div class='c ink'><div class='bg' style="{darkpat}"></div><div class='bg' style='background:rgba(26,21,18,.72)'></div>
<div class='z'><div class='eye' style='color:{T};filter:brightness(1.25);margin-top:0'>Aujourd'hui · Montréal</div><h1 style='font-size:100px'>Une histoire qui se porte encore.</h1>
<p style='color:{CREAM}'>Chez Folashade, chaque pièce prolonge ce voyage : de Java à l'Afrique de l'Ouest, jusqu'à ton quotidien à Montréal.</p>
<div class='pill' style='background:{T};color:{CREAM};margin-top:70px'>Enregistre ce post pour le relire</div></div>
<div class='foot' style='color:{SAND};align-items:flex-end'><img src='full_cream.png' style='height:130px'><span>6 / 6</span></div></div>""")
page('cyber-lundi',1080,1350,f"""<div class='c terra' style='text-align:center;padding-top:120px'><div class='bg' style="{terrapat}"></div><div class='bg' style='background:radial-gradient(circle at 50% 48%,{T} 0,{T} 34%,rgba(201,86,41,.55) 70%)'></div>
<div class='z'><img src='full_cream.png' style='height:170px'><div class='eye' style='color:{SAND};margin-top:120px'>Cyber lundi · 30 novembre</div>
<h1 style='font-size:210px;line-height:.98'>Dernier<br>jour</h1><p style='margin:56px auto 0;font-size:42px'>Le Vendredi fou se termine<br><b>ce soir à minuit.</b></p>
<div class='pill' style='background:{CREAM};color:{TD};margin-top:80px;font-size:34px'>Magasine en ligne · lien en bio</div></div></div>""")
page('blog-header',1200,630,f"""<div style='display:flex;width:1200px;height:630px'><div class='cream' style='width:760px;padding:76px 70px;position:relative'>
<div class='eye' style='margin:0 0 30px;font-size:20px;color:{T}'>Le blogue Folashade · Style</div><h1 style='font-size:76px'>Porter le wax en hiver à Montréal</h1>
<p style='font-size:28px;margin-top:28px;color:#4a403a'>Superposer, choisir ses pièces, garder ses couleurs de novembre à mars.</p><img src='word.png' style='position:absolute;left:70px;bottom:60px;height:40px'></div>
<div class='ink' style='flex:1;position:relative'><div class='bg' style="background-image:{pat(T,TD,SAND,.9,220)};background-size:220px 220px"></div><div class='bg' style='background:linear-gradient(90deg,rgba(26,21,18,0),rgba(26,21,18,.25))'></div>
<div style='position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:{INK};border-radius:50%;width:230px;height:230px;display:flex;align-items:center;justify-content:center'><img src='mono_cream.png' style='width:150px'></div></div></div>""")
def story(i,bg,eye,q,sub,dark=True,zone='rgba(251,247,242,.75)'):
    col=CREAM if dark else INK
    page(f'story-{i}',1080,1920,f"""<div style='position:relative;width:1080px;height:1920px;overflow:hidden;color:{col};text-align:center'>{bg}
<div class='z' style='padding-top:210px'><img src='{"mono_cream.png" if dark else "mono.png"}' style='height:110px'><div class='eye' style='color:{col};opacity:.9;margin-top:50px;font-size:26px'>On prépare les fêtes · {i}/3</div>
<h1 style='font-size:124px;padding:0 60px'>{q}</h1></div>
<div style='position:absolute;left:150px;right:150px;top:1060px;height:290px;border:3px dashed {zone if dark else TD};border-radius:28px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;letter-spacing:.2em;opacity:.85'>ZONE DU SONDAGE</div>
<div style='position:absolute;left:80px;right:80px;bottom:300px;font-size:40px;font-weight:600'>{sub}<br><img src='{"word_cream.png" if dark else "word.png"}' style='height:44px;margin-top:34px'></div></div>""")
story(1,f"<div class='bg' style='background:linear-gradient(90deg,#B3261E 50%,#1F6B4F 50%)'></div><div class='bg' style=\"background-image:{pat(CREAM,CREAM,CREAM,.16,180)};background-size:180px 180px\"></div>",'','Rouge<br>ou vert?','Ton vote choisit les pièces du Vendredi fou')
story(2,f"<div class='bg' style='background:{INK}'></div><div class='bg' style=\"{darkpat}\"></div><div class='bg' style='background:rgba(26,21,18,.6)'></div>",'','Robe<br><i style="font-size:.7em;color:'+SAND+'">ou</i><br>ensemble?','')
story(3,f"<div class='bg' style='background:{T}'></div><div class='bg' style=\"{terrapat}\"></div><div class='bg' style='background:rgba(201,86,41,.6)'></div>",'','<span style="font-size:.86em">Une touche de wax</span><br><i style="font-size:.7em;color:'+SAND+'">ou</i><br><span style="font-size:.86em">le look complet?</span>','Accessoire, sac, foulard… ou tenue de la tête aux pieds')
