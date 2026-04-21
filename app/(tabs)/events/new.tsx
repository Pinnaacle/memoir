import EventEditorScreen from '@/components/EventEditorScreen';
import { useCreateEventMutation } from '@/hooks/useEvents';
import { type CreateEventValues } from '@/lib/validation/event';

function createInitialValues(): CreateEventValues {
  return {
    title: '',
    occurredAt: new Date(),
    location: '',
    mood: 'Romantic',
    notes: '',
  };
}

export default function NewEventScreen() {
  const createEventMutation = useCreateEventMutation();

  return (
    <EventEditorScreen
      initialValues={createInitialValues()}
      onSubmit={(input) => createEventMutation.mutateAsync(input)}
      title="New Event"
    />
  );
}
