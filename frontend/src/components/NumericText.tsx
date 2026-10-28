/** Keep the original IZLOM numeral design while emphasizing digits inside product names. */
export function NumericText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\d+(?:[.,]\d+)*)/g).map((part, index) =>
        /^\d/.test(part) ? (
          <span className="swag-num swag-inline-number" key={index}>{part}</span>
        ) : (
          part
        ),
      )}
    </>
  );
}
