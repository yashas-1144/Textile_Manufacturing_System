import { useToast } from '@/components/ui/Toast';

/**
 * Returns a handler for actions that are represented in the UI shell but whose
 * full workflow is implemented in a later stage. It gives the user clear,
 * honest feedback instead of silently doing nothing.
 */
export function useMockAction() {
  const { addToast } = useToast();

  return (feature: string) =>
    addToast({
      type: 'info',
      title: feature,
      message: 'This action is part of the front-end shell. The full workflow will be implemented in a later stage.',
    });
}
