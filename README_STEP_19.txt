STEP 19 — SEAMLESS ZULF -> HOME RETURN

Это маленький polish поверх стабильного STEP 18.

Исправлена причина микро-рывка при ZULF -> главная:

РАНЬШЕ:
1. SWA6Y5TAN товары уже были готовы.
2. App ставил prepared skip для SWA6Y5TAN.
3. До обновления URL effect ещё на один кадр видел старый slug "zulf".
4. Так как prepared slug != zulf, старый effect запускал setLoading(true).
5. Получался микрокадр/skeleton/layout hit, который глаз воспринимал как дёрганье.

ТЕПЕРЬ:
- если идёт подготовленный программный switch, effects полностью игнорируют
  исходящий старый route;
- они ждут именно целевой slug;
- когда "/" становится SWA6Y5TAN, prepared state просто подтверждается;
- ни одного setLoading(true) между ZULF и готовым SWA6Y5TAN нет.

Дополнительно:
- если query уже нейтральный, setQuery не создаёт новый объект;
- это убирает лишний render/effect pass;
- у карточек убран scale .988 -> 1;
- теперь только opacity + y 10 -> 0;
- duration 220ms;
- stagger 18ms, максимум 120ms;
- убран постоянный will-change/forced GPU layer с каждой карточки;
- фон магазина меняется мягко за 170ms без linear flash.

Ничего другого не менялось:
- корзина = просто текст;
- повторный SWA6Y5TAN не перегружает товары;
- белый SWAG в ZULF;
- Shop Product Theme;
- SWAG CORE cart/checkout;
- обычный безопасный RAM prefetch.

ПРОВЕРКА:
cd C:\Users\umarc\tg-mini\frontend
npm run build

Если build зелёный:
cd C:\Users\umarc\tg-mini
git add frontend/src/App.tsx frontend/src/components/ShopTransitions.css
git commit -m "polish seamless shop return"
git push origin main
