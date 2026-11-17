exec(open('build.py').read())
X="""
.ph{position:absolute;object-fit:cover;object-position:50%% 12%%}
.tile{position:relative;overflow:hidden;border-radius:6px;background:#ddd}
.tile img{width:100%%;height:100%%;object-fit:cover;object-position:50%% 15%%}
.cap{font-family:FSerif;font-size:38px;line-height:1.15;margin-top:18px}
.price{font-weight:700;font-size:34px;color:%s;margin-top:8px}
.tag{display:inline-block;background:%s;color:%s;font-weight:700;font-size:24px;letter-spacing:.16em;text-transform:uppercase;padding:14px 26px;border-radius:999px}
""" % (T,T,CREAM)
def pg(name,body): page(name,1080,1350,body,X)
F=lambda i,n,dark=False: f"<div class='foot' style='color:{SAND if dark else TD}'><img src='{'word_cream.png' if dark else 'word.png'}'><span>{i} / {n}</span></div>"
# ---------- Bienvenue (5)
pg('bienvenue-1',f"""<div class='c ink'><img class='ph' src='ph/IMG_3180.jpg' style='inset:0;width:100%;height:100%;object-position:50% 20%'><div class='bg' style='background:linear-gradient(180deg,rgba(26,21,18,.55) 0,rgba(26,21,18,0) 26%,rgba(26,21,18,.05) 45%,rgba(26,21,18,.92) 78%)'></div>
<img class='z' src='full_cream.png' style='height:150px;margin-top:-50px'>
<div style='position:absolute;left:96px;right:96px;bottom:210px'><div class='eye' style='color:{SAND}'>Bienvenue · 1/5</div><h1 style='font-size:104px'>Folashade, c'est le wax <i style='color:{SAND}'>porté à Montréal.</i></h1></div>
<div style='position:absolute;left:96px;bottom:110px;font-size:32px;font-weight:600'>Glisse pour faire connaissance &nbsp;→</div></div>""")
pg('bienvenue-2',f"""<div class='c cream' style='padding-right:520px'><img class='ph' src='ph/about_portrait.jpg' style='right:0;top:0;width:440px;height:100%;object-position:50% 20%'>
<div class='eye' style='margin-top:0'>Qui est Folashade</div><h1 style='font-size:78px'>La mode africaine rencontre l'élégance d'aujourd'hui.</h1>
<p style='font-size:36px'>Une marque de prêt-à-porter de Montréal, qui célèbre <b>l'authenticité, l'artisanat et la diversité</b>.</p>
<p style='font-size:36px'>Notre mission : faire rayonner la richesse des cultures africaines à travers la mode.</p>{F(2,5)}</div>""")
pg('bienvenue-3',f"""<div class='c cream' style='padding-top:120px'><div class='eye' style='margin-top:0'>Deux lignes, une signature</div><h1 style='font-size:80px'>Du wax éclatant au prêt-à-porter.</h1>
<div style='display:flex;gap:28px;margin-top:50px'>
<div style='flex:1'><div class='tile' style='height:620px'><img src='ph/IMG_3142.jpg' style='object-position:50% 60%'></div><div class='cap'>Folashade Wax</div><div style='font-size:28px;margin-top:8px;color:#4a403a'>Les motifs et les couleurs du wax</div></div>
<div style='flex:1'><div class='tile' style='height:620px'><img src='ph/IMG_3056.jpg'></div><div class='cap'>Folashade Prêt-à-porter</div><div style='font-size:28px;margin-top:8px;color:#4a403a'>Des coupes pour tous les jours</div></div></div>{F(3,5)}</div>""")
tile3=lambda src,name,pos='50% 15%': f"<div style='flex:1'><div class='tile' style='height:640px'><img src='ph/{src}' style='object-position:{pos}'></div><div class='cap' style='font-size:32px'>{name}</div></div>"
pg('bienvenue-4',f"""<div class='c cream' style='padding:120px 70px 110px'><div class='eye' style='margin-top:0'>Nos pièces phares</div><h1 style='font-size:80px'>Trois façons de dire « c'est moi ».</h1>
<div style='display:flex;gap:22px;margin-top:50px'>{tile3('IMG_3180.jpg','Le blazer rouge en wax','50% 30%')}{tile3('IMG_3142.jpg','Le pantalon évasé en wax vert','50% 55%')}{tile3('p2303_1.jpg','La robe maxi à fleurs')}</div>
<div class='foot' style='left:70px;right:70px;color:{TD}'><img src='word.png'><span>4 / 5</span></div></div>""")
pg('bienvenue-5',f"""<div class='c terra' style='text-align:center;padding-top:150px'><div class='bg' style="{terrapat}"></div><div class='bg' style='background:radial-gradient(circle at 50% 50%,{T} 0,{T} 36%,rgba(201,86,41,.55) 72%)'></div>
<div class='z'><img src='full_cream.png' style='height:190px'><h1 style='font-size:118px;margin-top:110px'>Abonne-toi.<br><i style='color:{SAND}'>On te montre tout ce mois-ci.</i></h1>
<p style='margin:50px auto 0;font-size:38px;max-width:800px'>Nouveautés, coulisses, idées de looks et une surprise pour le Vendredi fou.</p>
<div class='pill' style='background:{CREAM};color:{TD};margin-top:70px;font-size:34px'>Suis @folashade_off</div></div></div>""")
# ---------- Guide cadeaux (7)
pg('guide-1',f"""<div class='c terra' style='padding:0'><img class='ph' src='ph/p2215_1.jpg' style='right:0;top:0;width:520px;height:100%;object-position:50% 10%'>
<div class='bg' style='background:linear-gradient(90deg,{T} 0,{T} 50%,rgba(201,86,41,0) 72%)'></div>
<div class='z' style='padding:110px 0 0 96px;width:640px'><img src='full_cream.png' style='height:140px'>
<div class='eye' style='color:{SAND};margin-top:230px'>Fêtes 2026 · 1/7</div><h1 style='font-size:122px;line-height:1.02'>Le guide cadeaux <i style='color:{SAND}'>Folashade</i></h1>
<p style='font-size:38px;max-width:520px'>Des cadeaux qui ont du caractère, pour tous les budgets.</p></div>
<div style='position:absolute;left:96px;bottom:110px;font-size:32px;font-weight:600'>Glisse pour trouver le tien &nbsp;→</div></div>""")
def gift(i,tag,src,name,price,pos='50% 15%',extra=''):
    pg(f'guide-{i}',f"""<div class='c cream' style='padding:110px 96px'><div class='tag'>{tag}</div>
<div class='tile' style='height:760px;margin-top:40px'><img src='ph/{src}' style='object-position:{pos}'></div>
<div class='cap' style='font-size:58px;margin-top:34px'>{name}</div><div class='price' style='font-size:46px'>{price}</div>{extra}{F(i,7)}</div>""")
pg('guide-2',f"""<div class='c cream' style='padding:110px 96px'><div class='tag'>Moins de 50 $</div>
<div style='display:flex;gap:28px;margin-top:40px'>
<div style='flex:1'><div class='tile' style='height:700px'><img src='ph/p2215_0.jpg' style='object-position:50% 10%'></div><div class='cap' style='font-size:40px'>Le haut en wax rouge et noir</div><div class='price'>49,99 $</div></div>
<div style='flex:1'><div class='tile' style='height:700px'><img src='ph/IMG-20240923-WA0405.jpg' style='object-position:50% 55%'></div><div class='cap' style='font-size:40px'>Les boucles d'oreilles au cauris</div><div class='price'>24,99 $</div></div></div>{F(2,7)}</div>""")
gift(3,'Moins de 100 $','IMG_3180.jpg','Le blazer rouge en wax','99,99 $','50% 35%')
gift(4,'La pièce signature','IMG_3056.jpg','La robe longue émeraude','149,99 $','50% 18%')
gift(5,'Pour lui','p2235_0.jpg','La chemise à motifs éclatants','60 $','50% 22%')
gift(6,'Pour les petits','jupe.jpg','La jupe enfant en wax','49,99 $','50% 45%')
pg('guide-7',f"""<div class='c ink' style='text-align:center;padding-top:150px'><div class='bg' style="{darkpat}"></div><div class='bg' style='background:rgba(26,21,18,.72)'></div>
<div class='z'><img src='full_cream.png' style='height:180px'><div class='eye' style='color:{T};filter:brightness(1.25);margin-top:100px'>Pour Noël</div>
<h1 style='font-size:112px'>Commande tôt,<br><i style='color:{SAND}'>offre sans stress.</i></h1>
<p style='margin:50px auto 0;font-size:38px;max-width:780px;color:{CREAM}'>Tag la personne à qui tu l'offrirais.</p>
<div class='pill' style='background:{T};color:{CREAM};margin-top:70px;font-size:34px'>Magasine en ligne · lien en bio</div></div>
<div class='foot' style='color:{SAND};justify-content:flex-end'><span>7 / 7</span></div></div>""")
