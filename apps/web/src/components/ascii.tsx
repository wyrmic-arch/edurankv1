// Generated ASCII art + terminal-flavoured UI primitives.

export function AsciiArt({ art, className = "", size = "clamp(4px, 0.9vw, 9px)" }: { art: string; className?: string; size?: string }) {
  return <pre className={`ascii ${className}`} style={{ fontSize: size }} aria-hidden="true">{art}</pre>;
}

export function asFrame(text: string, width = 72): string {
  const t = ` ${text} `.toUpperCase();
  const pad = Math.max(2, width - t.length - 2);
  const left = Math.ceil(pad / 2);
  const right = Math.floor(pad / 2);
  const top = "─".repeat(width);
  return [`┌${top}┐`, `│${' '.repeat(left)}${t}${' '.repeat(right)}│`, `└${top}┘`].join("\n");
}

export function AsciiBox({ title, className = "", children }: { title: string; className?: string; children?: React.ReactNode }) {
  return <div className={className}><AsciiArt art={asFrame(title, 56)} size="clamp(4px, 0.7vw, 7px)" />{children}</div>;
}

export function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-mute">
      <span className="ascii" style={{ fontSize: "clamp(5px,0.6vw,8px)" }}>{label ? `─ ${label.toUpperCase()} ─` : "─".repeat(40)}</span>
      <span className="flex-1 h-px bg-ink/20" />
    </div>
  );
}

export function Prompt({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[11px] uppercase tracking-label text-mute inline-flex items-center gap-2">
      <span className="text-mark">›</span>
      {children}
      <span className="animate-caret text-ink">█</span>
    </span>
  );
}

export const ART_WAVE = [
  'pdwd0dwuabm**#####*##MW&W&&*hha#%B%BB@@@@@@%&*bbhd0whLwMM@kqqQa%W#pwhW&WWMWWWW&BBBBBBBBBBBBB@@B@@BBBBBBBBBBBBBBB%8WMMMWMMM#MM#*#MM',
  'LJQbOdbuobZaa*MMMMM#MW&&WbwhW%B%%BB8aa888@$&ZLdOLZmampmQwhmLqpZpqOQqwMWWM#MMMMM&B%%%BBB%%BB@BBBBB%%%%BBB%%%%%%B%88&M######**##*###',
  'Ou0pZb&dXZwkh*####MMMW*bwdWB%%%%B$*dqJwn0kbhwUL(vY^~C#wJkwdO0#mmqmdpOd######MMW%%88B%%%%%%%B%%%%%88%8%%B%8WW&&88WMM##***##ooooo*##',
  'LfOpQqbduZOdbkhhho*abwp#8%%%%%B#ppw0ZaU~,^f+nZL?.!  ;toma8WqLwmpmpLObQkah*M&8888&&&888%888%%%888%8888%%%&MMMMWWWM#*ooo**#*oaaooo*#',
  'J}QpOOnQmm0ppbbbkqZphM88888%%%BWqm0UzCO[!;  ~]`-[ ..I-{UhmQpoZpoW%hohooahdd*a*W8&&8&8888&8%%8%888&88&WW&WWMMMMM###*ooao*oaoaaoooo#',
  'UvCwOZxZQQ0qqdbpJZM8888888%%%qrtJ{~jI`:(\'.:^.  `I\'\'  ^ 1Z*wvqZM*whqdo$8%hZQmQpOM8W8&88&8888%888%%88&MWM&WM######M#ooaaaoaaaoaaaao*',
  '0/0wOQO0ZO0wwpmOk8W&&8888888Bh. [\' i,\'  !I.  \'l;\' ^.i,;;\'_\\)}Jk*ObZZphpkwaadpobk#&8&8888888%88&&8&&&88&88&W##MMMM##*ooooooooaaaaao',
  'wnZwwwwZZwpwQCa8%8W&&88&888%%M- ^ `^^  <+,\'.:?^   ;;\'     inw8hQqMO0dmmhhmd*MWW0OhW&&&88888%%888%%88888%%88M#MMMM#*ooo**oooaa*ooo*',
  'qwwwmwwwZO0UZo%88%88&888%%%%%B%f<,.><`.<;< ._: \',~\'^ ; \',>~roho0ZOqwpqZ#aLhBdwqd*dmW&&&8888%%8%8%888&&88%88&WW888&W#MMWWMWMMWW&&MM',
  'OZZOO0UvuCb#WW888888WMM88%%BB%@$&oq*kcj[~; IlI::~;;<\'.-~[[vzmooQwppwpZb#$WOmZCZ88MoMWWMMWW8%%%%%8&88W&888888&88888&MMM&WW8&WWWWMMW',
  ')}1-(}fCa#WW#M&&MWWobZU#%%%BB%kd#&$8wLCrl. ]l~:!<i,..>?>v#%&8%MbwqqwpoZqh%M0mOqpoWWMWW&&&&8%%88B%8&&&8888&888888888&88%88&8W&88&&&',
  '!?/vwhM&&WWM#*aQQpbmQJk8%&*W%8OLwLdp%b?<~]Uf[]~>:`: `>!J%88&8%8Mqd#0pW##O0#*pmZwUbMMWWW&&88&8888%8888%88%&8%88%888%88%%%888&&&88&W',
  'Za#####*#&8W#0OLdhdYQYmpk#Om&bLCapQCkaWba*0n_<-~,,`.!+<a8&8W&88W888#W888*mbWZmp&*MWW&&&&&&8%8%88888WW888888888888888888888&&WWW&&&',
  'kwOwdpLU0#bdUrLh#&8opzwXudOqkqq0#am#aZdphZddO0wwQxl>ii-#&8&&&88&8WW&&W&8*aowdoO#MMMWWW&&&8&8%%8888&WW&&W88W&8&88888%8888888&WWW&&&',
  'kbZLJJYXCOLf]^>(LfJ0LObUvpO0qq+_1Or\\C>}OWwwmhbz[?1! :InWW&&W&88WWWMM&&WWWWM#WM#M#MMWMMWWW&&8%&&&8&WWW&8&&&&&8888&&88&88&&888&&&WW&',
  'kLLYU0QJUQaO( I<:``fM*kQJJLOd&}:I-I!Ill)i/dq#nt.^\'> \'lU8WW&W&88&WMWWMWWWWWWM&MWWWMWW888888&888&WWWWWWW&&WW&W&8&&&88&W&&&W&88888&8&',
  'YYLcZJXOmLZ0znX}IiI~Lp0Cq0mhM&h0OXZp{ ^~l>+\\t_{_.i,: !{#&88&888&WMW&W&&WWW&W&W&&W&W&&8888&W&8&WWWWWWW&&8&&WW&&WW&8&WM&&WWW&88&&W8&',
  'cYCwv,+nQ|x0O[{-[;I>cpLO0cLwZhdo#mZQc{-~^\',-}rII^~`,1I{C8MWMWWWWMMW&WWWMMWWWWWWWWWWWWW&&8&&&&WWMWWWW&&&88&&&&&&&WWWMMMWWMWW&W&8&hh',
  'zz-fpc>`>i;`t> ~~;-fLUQXvC)~<z0ZOqd0r[ <l\'l;<II`:,_,I^l-dM##MMM###MM##MMMMMMWWMWWWMMWWWWWWWMM#MMMWWWWWWWWMWWWWMM###oo*#M*#WbQMbUO8',
  '{[+iQdU{1<;`>! `_~<}OJ};,{?i,:{0pL--)?~\'\'<i^lvU\\I~f+\'\';r]Z*oooo*o****o#MM##WMM*M#M#M##MMM#M###***##*o#**#***#oaahbdbdbbbbhJCZOLk$@',
  'hpddO0wYXx[I^I,il?<;+tII;>_t>\' )_~t-l>>;,)Ij8$$$MpCrj]:`^icdppppdddkhaaahaaoooaaaaaahaoaoooahhhkkkkkkbdbdppqwZOOOQLLLCJzj-+fZaB$@B',
  'QZO0LmbpZZzCu}~+I\'l!!`i-I<^;li!^.`!l:]~?I>z@$B@@$$$$$$O-l,>|JCJQLLZQ0ZZZqZwppdmmmwmmmmmmqwwqmZmmZOOOO0LLCUYYXzcccvunu|{(><vp8$@@@$',
  'mLZOULp#h0CvJZYj{-+,I,>I~::;I:?]IIiI<c\\z0M$$@@@$@@@@@$$WnIll{czUYLvvvXXczXzYYYYXXXzzXzzzzzYYzzvccccuunxnxxjttfjjjj/<_/<|fZ8$$@$@Bd',
  '0YJLLb*omqXrvLYYJQYf/1[+>;^:>-!\':>~+,-p%$$@@$$%#B$@@$@@$oCfI.<|tvvffjtfjft/fttttfffttftjvxtffrtffttt/\\\\/t/\\|\\\\\\/1~]\\?|xm%$$WW#MBkY',
  't<Iu|1vXI<rvXxvUQCUJQZwLYt/{f\\}>^;>/Z8$@@@@$$%*pO*8$@$@@BabpJ)?>?()(\\(|\\(((((((((|\\()/J*@8du\\\\/\\||(|(|((|\\||\\|(tnfuv0hB%ooaw#w1[|<',
  '` `?I|:f, <1XXcrccYOZ0LJxjzJncOdho&$$@@@@B%%MbLmaWB@$@@@@$#0o$%pOmC([1)1{{}{}{1{{{1rZM$$$$BBpr){{11)))1{}{||jzJOmb#%$$$B#JYrCn(<,;',
  'Q^\';;(>II!, ;[vXvcxxxx0u!:i\\fp%@@@@BB@@BB%hqkkb0O%$8B$$$$$$8awo8dpWhU|}{111)1(rnxxQpdruQM$Od@%hOj1{1)(c/fzL0Omph8BBko8qkabQr(?>]xO',
  '#m\\>l-::I::,,!!xOOZLXvpkbmh8$B%%BBBB@d0dBMbmdZdQwbhdZM$abM%8$WQopmaW8&wv}_~<<?}]1(cCn<>lrr_l1\\rct_>>(LmZQOwkahMdpZmczJ1-rvYUp*&*qL',
  '*#MapOzYcuCQmd#888888&&Wbho*W8%%B%B$a0m#obwQUkQoBBbbpbhhYLhw#$%kwmzwB$hkomUnf1l^   \'i-_<i<~<~-+??{}|rLbo*h#*WhL)_{?1tcQqaM#*hpmc)f',
  '##o*##&%%BB%BBW**W888&&MwOOdbkM%*0pbZQaLQwdhk%#wbhdkwkJbj-|ZpaBBaYf_\\aO?rw&%Uqokm0LzrrrrvOQ0mdddaMk#MhOQLtLYw#Q0ZdoM#WWowv[~!I>fZM',
  '#apwqqboW&&888amkkW88&&&dmJmkqw*&odOobkC*%8B$@Bhddm#%|<vcu1[qZpzaoC).;Ud)]tdYI]CoW8%B%WW&MM**#M##MabhW*aM&88&8%8kXrf[_]]~:^,+zhMM#'
].join('\n');

export const ART_HORIZON = [
  '                    .-~~-.',
  '                 .-\' o  o \'-.',
  '                /   o o o .  \\',
  '               |  o o o o o   |',
  '                \\  . o o  o  /',
  '                 \'-.  o  .-\'',
  '                    \'-..-\''
].join('\n');

export const ART_PROMPT = [
  '$ ./edurank --join',
  '> welcome to the arena'
].join('\n');
