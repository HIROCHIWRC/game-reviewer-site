import { Modal } from './Modal';
import { SecondaryButton } from './SecondaryButton';
import { RedButton } from './RedButton';

export function DeleteModal({ visible, gameTitle, onConfirm, onCancel }) {
  return (
    <Modal
      visible={visible}
      title={<span className="flex items-center gap-2"><span className="text-rose-500">⚠️</span> Удалить игру?</span>}
      onClose={onCancel}
      size="sm"
    >
      <p className="text-sm text-slate-400 mb-6 leading-relaxed">
        Вы уверены, что хотите безвозвратно стереть{' '}
        <span className="text-violet-400 font-bold break-words">"{gameTitle}"</span> из базы данных рейтинга?
      </p>
      <div className="flex justify-end gap-3">
        <SecondaryButton
          text="Отмена"
          onClick={onCancel}
          variant="ghost"
        />
        <RedButton
          text="Да, удалить"
          onClick={onConfirm}
        />
      </div>
    </Modal>
  );
}