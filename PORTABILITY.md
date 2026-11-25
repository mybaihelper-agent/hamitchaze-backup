# המתחזה בחללית — הערות ניידות (25.11.2026)

המטרה: כל חלק עובד אצלנו ואפשר להעביר אותו לכל שירות אינטרנט אחר.

## החלקים
1. **המשחק עצמו** — קבצים סטטיים בלבד (תיקיית `site/`): HTML/JS/CSS, בלי שרת.
2. **`/ice`** — פונקציית ענן אחת קטנה (`site/functions/ice.js`, כ-70 שורות Web API סטנדרטי) שמנפיקה סיסמת TURN זמנית. רק ה-fallback לממסר תלוי בה; משחק רגיל (P2P) עובד גם בלעדיה.
3. **סודות** — `METERED_SECRET` (משתנה סביבה בפרויקט, אף פעם לא בקוד הלקוח) וטוקן ה-deploy. שניהם שמורים בכספת.
4. **צד שלישי** — PeerJS cloud (signaling חינמי), Metered (שרתי TURN), STUN של Google/Cloudflare.

## העברה לאחסון סטטי אחר (Netlify / Vercel / GitHub Pages / S3)
מעלים את `site/` כמות שהיא (בלי `functions/` — היא ספציפית ל-Cloudflare). המשחק עובד מלא, כולל חדרים מקוונים; רק הממסר לא פעיל עד שמעבירים גם את `/ice`.
**נבדק 25.11:** שחזור מלא מה-zip לפרויקט Cloudflare נפרד לקח ~2 דקות ועבר בדיקת /ice.
**נבדק 25.11 (ספק עצמאי):** אותה תיקיית `site/` עלתה ל-GitHub Pages ומשחקת: https://mybaihelper-agent.github.io/hamitchaze-backup/site/ (P2P מלא; בלי /ice, כלומר בלי ממסר). המקור + המסמך הזה: https://github.com/mybaihelper-agent/hamitchaze-backup

## העברת `/ice`
- **Cloudflare Pages אחר:** פרויקט חדש → משתנה סביבה `METERED_SECRET` → `wrangler pages deploy`. זה הכול (נבדק).
- **ספק serverless אחר (Netlify/Vercel):** אותו קוד, משנים רק את עטיפת הקובץ (למשל `netlify/functions/ice.mjs` עם `export default`) ומגדירים `METERED_SECRET` ב-env שלהם.
- אחרי כל מעבר: לעדכן בראש הקובץ את `ALLOWED` (הדומיינים המורשים לבקש סיסמה) ואת `relayEndpoint` ב-`site/ice.js` אם הדומיין השתנה (ברירת מחדל: same-origin).

## החלפת PeerJS
ברירת מחדל: הענן החינמי `0.peerjs.com`. לשרת עצמאי: `npm i peer` + `npx peerjs --port 9000`, ומעדכנים host ב-`net.js` (מקום אחד).

## החלפת ספק TURN (Metered)
משנים רק ב-`functions/ice.js`: את `TURN_URLS`, את כתובת ה-API שמנפיקה סיסמאות, ואת הסוד ב-env. אפשר גם coturn self-hosted.

## גרסאות
`GAME_VERSION` ב-`index.html` + `VERSION` ב-`sw.js` — מבודדים חדרים בין גרסאות. מקפיצים בכל שינוי פרוטוקול.

## מיקום נוכחי
- ראשי: https://hamitchaze-ron.pages.dev (Cloudflare Pages, חשבון ראשי, פרויקט `hamitchaze-ron`)
- גיבוי/בדיקות: https://hamitchaze-turn-test.pages.dev (אותו חשבון, נבנה מחדש מאותו zip ב-25.11)
- גיבוי בספק עצמאי: https://mybaihelper-agent.github.io/hamitchaze-backup/site/ (GitHub Pages, סטטי בלבד; בלי ממסר)
