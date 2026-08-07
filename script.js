document.querySelectorAll('.day-card').forEach((card) => {
  card.addEventListener('toggle', () => {
    if (!card.open) return;
    document.querySelectorAll('.day-card[open]').forEach((other) => {
      if (other !== card) other.open = false;
    });
  });
});
