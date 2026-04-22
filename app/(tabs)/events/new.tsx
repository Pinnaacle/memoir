import EventForm from '@/components/EventForm';
import { useActiveGroup } from '@/hooks/useActiveGroup';

export default function NewEventScreen() {
  const { activeGroup } = useActiveGroup();

  return <EventForm activeGroupId={activeGroup?.id ?? null} />;
}
