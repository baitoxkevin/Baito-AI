import ProfilePage from './ProfilePage';
import { ToastContainer, useToast } from './hooks/use-toast';

export default function App() {
  const { toasts } = useToast();

  return (
    <>
      <ProfilePage />
      <ToastContainer toasts={toasts} />
    </>
  );
}
