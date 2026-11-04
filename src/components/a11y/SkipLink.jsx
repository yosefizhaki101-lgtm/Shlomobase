export default function SkipLink() {
  const handleClick = (event) => {
    const target =
      document.getElementById('main-content') || document.querySelector('main, [role="main"]');
    if (!target) return;
    event.preventDefault();
    target.setAttribute('tabindex', '-1');
    target.focus();
    target.scrollIntoView({ block: 'start' });
  };

  return (
    <a href="#main-content" onClick={handleClick} className="a11y-skip-link">
      דילוג לתוכן הראשי
    </a>
  );
}