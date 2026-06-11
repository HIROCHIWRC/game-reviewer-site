import { IconButton } from './IconButton';

export function InfoButton({ active, onToggle }) {
  return (
    <IconButton
      variant={active ? 'violet' : 'default'}
      size="sm"
      onClick={onToggle}
      aria-label={active ? 'Скрыть информацию' : 'Показать информацию'}
      title={active ? 'Скрыть информацию' : 'Показать информацию'}
    >
      i
    </IconButton>
  );
}