import React, { memo, useState, useRef, useEffect } from 'react';
import { IonItem, IonLabel, IonButton, IonImg, IonCheckbox, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonContent, createAnimation } from '@ionic/react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet with Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
import { TaskProps } from './TaskProps';
import { modalEnterAnimation, modalLeaveAnimation } from '../theme/animations';

interface TaskPropsExtended extends TaskProps {
  onRemove?: (id?: string) => void;
  onEdit?: (task: TaskProps) => void;
}

const Task: React.FC<TaskPropsExtended> = ({ _id, text, description, amount, date, isCompleted, photo, lat, lng, onRemove, onEdit }) => {
  const [showMap, setShowMap] = useState(false);
  const task = { _id, text, description, amount, date, isCompleted, photo, lat, lng };
  const itemRef = useRef<HTMLIonItemElement>(null);

  useEffect(() => {
    if (itemRef.current) {
      const animation = createAnimation()
        .addElement(itemRef.current)
        .duration(500)
        .fromTo('opacity', '0', '1')
        .fromTo('transform', 'translateY(20px)', 'translateY(0)');
      animation.play();
    }
  }, []);

  return (
    <IonItem ref={itemRef}>
      <IonLabel>
        <h2>{text}</h2>
        <p>{description}</p>
        <p>Amount: {amount}</p>
        {date && <p>Date: {new Date(date).toLocaleDateString()}</p>}
        {isCompleted !== undefined && <p>Completed: {isCompleted ? 'Yes' : 'No'}</p>}
        {photo && <IonImg src={`data:image/jpeg;base64,${photo}`} style={{ width: '100px', height: '100px' }} />}
        {lat !== undefined && lng !== undefined && (
          <IonButton fill="clear" onClick={(e) => {
            e.stopPropagation(); // Prevent IonItem click from firing
            setShowMap(true);
          }}>
            View Location
          </IonButton>
        )}
      </IonLabel>
      <IonButton slot="end" onClick={() => onEdit?.(task)}>
        Edit
      </IonButton>
      <IonButton slot="end" onClick={() => onRemove?.(_id)}>
        Delete
      </IonButton>

      <IonModal
        isOpen={showMap}
        enterAnimation={modalEnterAnimation}
        leaveAnimation={modalLeaveAnimation}
        onDidDismiss={() => setShowMap(false)}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Task Location</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowMap(false)}>Close</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {lat !== undefined && lng !== undefined && (
            <MapContainer center={[lat, lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={[lat, lng]} />
            </MapContainer>
          )}
        </IonContent>
      </IonModal>
    </IonItem>
  );
};

export default memo(Task);
