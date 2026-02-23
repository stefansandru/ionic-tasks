import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact, IonHeader, IonToolbar, IonTitle, IonBadge } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { IonButton } from '@ionic/react'; // Add this import
import { useServerStatus } from './core/useServerStatus';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';
import { TaskList } from './todo/Index';
import TaskProvider from './todo/TaskProvider';
import AuthProvider, { useAuth } from './auth/AuthContext';
import withAuth from './auth/withAuth';
import Login from './Login';


setupIonicReact();

// Legacy HOC usage: wrap protected pages with `withAuth`
const ProtectedTaskList = withAuth(TaskList);

const Header: React.FC = () => {
  const auth = useAuth();
  const { isOnline } = useServerStatus(4000);

  return (
    <IonHeader>
      <IonToolbar>
        <IonTitle>My App</IonTitle>
        <IonBadge slot="end" color={isOnline ? 'success' : 'medium'}>
          {isOnline ? 'Online' : 'Offline'}
        </IonBadge>
        {auth.isAuthenticated && (
          <IonButton slot="end" onClick={auth.logout} color="danger">
            Logout
          </IonButton>
        )}
      </IonToolbar>
    </IonHeader>
  );
};

const App: React.FC = () => (
  <IonApp>
    <AuthProvider>
      <TaskProvider>
        <IonReactRouter>
          <Header /> {/* Updated Header to include title and logout button */}
          <IonRouterOutlet>
            <Route exact path="/home">
            </Route>
            <Route path="/login" component={Login} exact={true} />
            <Route path="/tasks" component={ProtectedTaskList} exact={true} />
            <Route exact path="/" render={() => <Redirect to="/tasks"/>}/>
          </IonRouterOutlet>
        </IonReactRouter>
      </TaskProvider>
    </AuthProvider>
  </IonApp>
);

export default App;
