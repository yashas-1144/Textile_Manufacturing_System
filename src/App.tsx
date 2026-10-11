
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from '@/app/providers';
import { AuthProvider } from '@/app/auth-context';
import { router } from '@/app/router';


function App() {
  return (
    <AppProviders>
      <AuthProvider>
        <>
          <RouterProvider router={router} />
        </>
      </AuthProvider>
    </AppProviders>
  );
}

export default App;
