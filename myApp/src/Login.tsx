import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonButton, IonInput, IonItem, IonLabel, IonPage, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/react';
import { useAuth } from './auth/AuthContext';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const history = useHistory();

  const doLogin = async () => {
    setError(null);
    try {
      await auth.login(username, password);
      history.replace('/tasks');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel position="stacked">Username</IonLabel>
          <IonInput value={username} onIonChange={e => setUsername(String(e.detail.value || ''))} />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Password</IonLabel>
          <IonInput type="password" value={password} onIonChange={e => setPassword(String(e.detail.value || ''))} />
        </IonItem>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        <IonButton expand="block" onClick={doLogin} style={{ marginTop: 16 }}>Login</IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Login;
