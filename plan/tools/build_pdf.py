#!/usr/bin/env python3
"""Render the complete source plan as a linked, typeset PDF. Requires reportlab."""
from pathlib import Path
import re,json,html,os,textwrap
from reportlab.platypus import BaseDocTemplate,PageTemplate,Frame,Paragraph,Spacer,PageBreak,Table,TableStyle,Preformatted,KeepTogether,Flowable
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
ROOT=Path(__file__).resolve().parents[2]; PLAN=ROOT/'plan';OUT=ROOT/'output/pdf/common-ground-master-plan.pdf'
FONT=Path('/Users/atharvraotole/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/Resources/fonts/truetype')
for name,file in [('Body','NotoSans-Regular.ttf'),('BodyB','NotoSans-Bold.ttf'),('BodyI','NotoSans-Italic.ttf'),('Mono','DejaVuSansMono.ttf')]:
 f=FONT/file
 if not f.exists() and name=='Mono':f=FONT/'LiberationMono-Regular.ttf'
 pdfmetrics.registerFont(TTFont(name,str(f)))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='BodyB',italic='BodyI',boldItalic='BodyB')
INK=colors.HexColor('#183431');MUTED=colors.HexColor('#536561');GREEN=colors.HexColor('#146B5B');PALE=colors.HexColor('#EDF4EF');LINE=colors.HexColor('#CCD8D1');W,H=A4;CW=W-100
styles={
 'body':ParagraphStyle('Body',fontName='Body',fontSize=9.2,leading=13.7,textColor=INK,spaceAfter=7,splitLongWords=True),
 'h1':ParagraphStyle('H1',fontName='BodyB',fontSize=23,leading=28,textColor=INK,spaceAfter=16,keepWithNext=True),
 'h2':ParagraphStyle('H2',fontName='BodyB',fontSize=13.3,leading=18,textColor=GREEN,spaceBefore=13,spaceAfter=7,keepWithNext=True),
 'h3':ParagraphStyle('H3',fontName='BodyB',fontSize=10.6,leading=15,textColor=INK,spaceBefore=10,spaceAfter=5,keepWithNext=True),
 'small':ParagraphStyle('Small',fontName='Body',fontSize=8,leading=11.5,textColor=MUTED,spaceAfter=6,splitLongWords=True),
 'cell':ParagraphStyle('Cell',fontName='Body',fontSize=8,leading=11.5,textColor=INK,spaceAfter=1,splitLongWords=True),
 'th':ParagraphStyle('TableHead',fontName='BodyB',fontSize=8,leading=11.5,textColor=INK,spaceAfter=1),
 'code':ParagraphStyle('Code',fontName='Mono',fontSize=7.2,leading=10.3,textColor=INK,backColor=PALE,borderPadding=8,spaceAfter=8),
 'quote':ParagraphStyle('Quote',fontName='BodyI',fontSize=8.8,leading=13,textColor=MUTED,leftIndent=12,spaceAfter=8),
 'bullet':ParagraphStyle('Bullet',fontName='Body',fontSize=9.2,leading=13.7,textColor=INK,leftIndent=12,firstLineIndent=-10,spaceAfter=5),
 'cover':ParagraphStyle('Cover',fontName='BodyB',fontSize=48,leading=52,textColor=INK,spaceAfter=18),
 'subtitle':ParagraphStyle('Subtitle',fontName='Body',fontSize=18,leading=25,textColor=GREEN,spaceAfter=20),
}
m=json.loads((PLAN/'phases.json').read_text())
files=sorted(PLAN.glob('[0-9][0-9]-*.md'))+[PLAN/p['file'] for p in m['phases']]+[f for f in sorted((PLAN/'templates').glob('*.md')) if f.name!='README.md']+[PLAN/'SOURCES.md']
anchors={f.resolve():f'section-{i}' for i,f in enumerate(files)}
anchors[(PLAN/'README.md').resolve()]=anchors[files[0].resolve()]
anchors[(PLAN/'phases/README.md').resolve()]=anchors[(PLAN/'09-roadmap-and-dependencies.md').resolve()]
anchors[(PLAN/'templates/README.md').resolve()]=anchors[(PLAN/'templates/decision-record.md').resolve()]
def norm(s):
 for a,b in [('—',' - '),('–','-'),('‑','-'),('−','-'),('‘',"'"),('’',"'"),('“','"'),('”','"'),('\u00a0',' ')]:s=s.replace(a,b)
 return s

def inline(s,source):
 s=norm(s);tokens={}
 def hold(x):
  k=f'ZZPROTECTED{len(tokens)}ZZ';tokens[k]=x;return k
 def link(mt):
  label,url=mt.groups();target=url.split('#',1)[0]
  if url.startswith(('http://','https://')):
   return hold(f'<link href="{html.escape(url,quote=True)}" color="#146B5B">{html.escape(label)}</link>')
  path=(source.parent/target).resolve()
  if path in anchors:return hold(f'<link href="#{anchors[path]}" color="#146B5B">{html.escape(label)}</link>')
  return hold(html.escape(label))
 s=re.sub(r'\[([^\]]+)\]\(([^\s)]+)\)',link,s)
 # Link bare URLs without disturbing protected links.
 s=re.sub(r'https?://[^\s<>]+',lambda mt:hold(f'<link href="{html.escape(mt.group().rstrip(".,;"),quote=True)}" color="#146B5B">{html.escape(mt.group().rstrip(".,;"))}</link>'),s)
 s=html.escape(s)
 s=re.sub(r'`([^`]+)`',lambda mt:'<font name="Mono">'+mt.group(1)+'</font>',s)
 s=re.sub(r'\*\*([^*]+)\*\*',r'<b>\1</b>',s)
 s=re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)',r'<i>\1</i>',s)
 for k,v in tokens.items():s=s.replace(k,v)
 return s
class Diagram(Flowable):
 def __init__(self,roadmap=False):Flowable.__init__(self);self.width=CW;self.height=240 if not roadmap else 210;self.roadmap=roadmap
 def draw(self):
  c=self.canv;c.setStrokeColor(LINE);c.setLineWidth(.8)
  if self.roadmap:
   labels=['W1  Prove the job','W2  Secure foundation','W3  Real taste inputs','W4  Agent decisions','W5  Complete handoff','W6  Harden and measure','W7  Human evidence','W8  Release and decide']
   for i,label in enumerate(labels):
    y=183-i*24;c.setFillColor(PALE);c.roundRect(0,y-5,24,20,5,fill=1,stroke=0);c.setFillColor(GREEN);c.setFont('BodyB',8);c.drawCentredString(12,y+1,str(i+1));c.setFillColor(INK);c.setFont('Body',10);c.drawString(38,y,label)
    c.setFillColor(MUTED);c.setFont('Body',8);c.drawRightString(CW,y,'24h planned + 6h reserve')
  else:
   nodes=[(0,183,150,'Host + participants'),(180,183,315,'Worker authorization / policy'),(0,114,150,'D1: scoped state'),(180,114,145,'Qloo: common-slate ranks'),(350,114,145,'OpenAI: bounded tools'),(180,45,315,'Constraints + deterministic compromise'),(180,-5,315,'Explicit acceptance / host handoff')]
   for x,y,w,label in nodes:
    c.setFillColor(PALE);c.roundRect(x,y,w,35,6,fill=1,stroke=0);c.setFillColor(INK);c.setFont('Body',8.1);c.drawCentredString(x+w/2,y+13,label)
   for x1,y1,x2,y2 in [(150,200,180,200),(337,183,252,149),(337,183,422,149),(180,200,75,149),(252,114,300,80),(422,114,380,80),(337,45,337,30)]:c.line(x1,y1,x2,y2)
class Doc(BaseDocTemplate):
 def __init__(self,path):
  super().__init__(str(path),pagesize=A4,leftMargin=50,rightMargin=50,topMargin=54,bottomMargin=48,title='Common Ground | Startup and Hackathon Master Plan',author='Prepared with Codex',allowSplitting=1)
  self.addPageTemplates(PageTemplate(id='main',frames=[Frame(50,48,CW,H-102,id='normal',leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)],onPage=self.page))
 def page(self,c,d):
  if d.page==1:
   c.setFillColor(PALE);c.rect(0,0,W,H,fill=1,stroke=0);c.setFillColor(GREEN);c.rect(0,H-16,W,16,fill=1,stroke=0)
  else:
   c.setStrokeColor(LINE);c.setLineWidth(.5);c.line(50,H-34,W-50,H-34)
   c.setFont('BodyB',7.5);c.setFillColor(GREEN);c.drawString(50,H-25,'COMMON GROUND / STARTUP + HACKATHON PLAN')
  c.setFont('Body',7.5);c.setFillColor(MUTED);c.drawString(50,27,'3 OCTOBER 2026  |  RESEARCHED PROPOSAL  |  NOT YET VALIDATED');c.drawRightString(W-50,27,str(d.page))
 def afterFlowable(self,f):
  if isinstance(f,Paragraph) and hasattr(f,'anchor'):
   self.canv.bookmarkPage(f.anchor);self.canv.addOutlineEntry(f.getPlainText(),f.anchor,level=0,closed=False)
   self.notify('TOCEntry',(0,f.getPlainText(),self.page,f.anchor))

def render_md(file):
 out=[];lines=file.read_text().splitlines();i=0;first=True
 body_style=ParagraphStyle('BudgetBody',parent=styles['body'],leading=13.0,spaceAfter=6) if file.name.startswith('05-') else styles['body']
 while i<len(lines):
  line=lines[i].strip()
  if not line:i+=1;continue
  if line.startswith('```'):
   lang=line[3:].strip();code=[];i+=1
   while i<len(lines) and not lines[i].startswith('```'):code.append(lines[i]);i+=1
   i+=1
   if lang=='mermaid':out.append(Diagram('roadmap' in file.name));out.append(Spacer(1,12));continue
   wrapped=[]
   for row in code:
    row=norm(row)
    wrapped+=textwrap.wrap(row,width=90,replace_whitespace=False,drop_whitespace=False,break_long_words=True,break_on_hyphens=False) or ['']
   # Limit indivisible blocks so long contracts cannot overflow a page.
   for start in range(0,len(wrapped),42):out.append(Preformatted('\n'.join(wrapped[start:start+42]),styles['code']))
   continue
  if line.startswith('|'):
   rows=[]
   while i<len(lines) and lines[i].strip().startswith('|'):
    row=lines[i].strip().strip('|'); cells=[c.strip() for c in row.split('|')]
    if not all(re.fullmatch(r'[:\-\s]+',c or '-') for c in cells):rows.append(cells)
    i+=1
   n=max(len(r) for r in rows)
   for r in rows:r.extend(['']*(n-len(r)))
   weights=[1]*n
   if n==2:weights=[.9,1.7]
   elif n==3:weights=[1,1.5,1.7]
   elif n==4:weights=[.8,1,1.2,1.7]
   elif n==5:weights=[.5,1.1,1,1.6,.5]
   if n==5 and 'roadmap' in file.name:weights=[.38,.60,.80,1.7,1.8]
   widths=[CW*w/sum(weights) for w in weights]
   cells=[[Paragraph(inline(c,file),styles['th' if ri==0 else 'cell']) for c in r] for ri,r in enumerate(rows)]
   table=Table(cells,colWidths=widths,repeatRows=1,hAlign='LEFT')
   table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),PALE),('VALIGN',(0,0),(-1,-1),'TOP'),('LINEBELOW',(0,0),(-1,0),.7,GREEN),('LINEBELOW',(0,1),(-1,-1),.3,LINE),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]))
   out+=[table,Spacer(1,10)];continue
  if line.startswith('#'):
   match=re.match(r'^(#+)\s+(.*)',line)
   if match:
    level=len(match.group(1));p=Paragraph(inline(match.group(2),file),styles['h1' if level==1 else 'h2' if level==2 else 'h3'])
    if level==1 and first:p.anchor=anchors[file.resolve()];first=False
    out.append(p);i+=1;continue
  if line in ('---','***'):out.append(Spacer(1,10));i+=1;continue
  if line.startswith('>'):
   out.append(Paragraph(inline(line.lstrip('> '),file),styles['quote']));i+=1;continue
  bullet=re.match(r'^(?:[-*]\s+|\d+\.\s+)(.*)',line)
  if bullet:
   s=bullet.group(1);s=re.sub(r'^\[ \]\s*','',s)
   out.append(Paragraph('- '+inline(s,file),styles['bullet']));i+=1;continue
  para=[line];i+=1
  while i<len(lines) and lines[i].strip() and not re.match(r'^(#|\||```|>|[-*]\s|\d+\.\s)',lines[i].strip()):para.append(lines[i].strip());i+=1
  out.append(Paragraph(inline(' '.join(para),file),body_style))
 return out
story=[Spacer(1,100),Paragraph('COMMON<br/>GROUND',styles['cover']),Paragraph('A venue-planning agent<br/>for recurring local communities.',styles['subtitle']),Spacer(1,20)]
for label,value in [('THE BUILD','Eight hypothetical weeks / 32 executable phases'),('THE BUDGET','192 planned hours + 48 hours contingency'),('THE STACK','Free infrastructure / Qloo access conditional / existing OpenAI'),('THE STANDARD','Evidence first. A 9/10 score must be earned.')]:
 story.append(Paragraph(label,styles['h3']));story.append(Paragraph(value,styles['body']))
story+=[Spacer(1,22),Paragraph('STARTUP STRATEGY · PRODUCT SPECIFICATION · TECHNICAL DESIGN<br/>ACCEPTANCE CRITERIA · CI · VERIFICATION · CUSTOMER EXPERIMENTS',styles['small']),PageBreak(),Paragraph('How to use this plan',styles['h1']),Paragraph('Read the decision brief and validation rubric before committing to the build. Each phase is a standalone work package with dependencies, effort, acceptance criteria, CI/manual checks and evidence. The editable Markdown files are the source of truth; this PDF is the complete reading copy.',styles['body']),Paragraph('No customer interviews, live authenticated Qloo calls, payments or product deployments have been completed. The current evidence-weighted startup score is 4.7/10. The plan defines the experiments and rights checks needed to earn a stronger assessment.',styles['body']),Paragraph('Contents',styles['h2'])]
toc=TableOfContents();toc.levelStyles=[ParagraphStyle('TOC',fontName='Body',fontSize=8.5,leading=13.2,textColor=INK,spaceBefore=5,leftIndent=0,firstLineIndent=0)];story.append(toc)
for file in files:story.append(PageBreak());story+=render_md(file)
OUT.parent.mkdir(parents=True,exist_ok=True)
Doc(OUT).multiBuild(story)
print(OUT)
