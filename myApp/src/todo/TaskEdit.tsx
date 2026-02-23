import React, { useState } from 'react';
import {
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonPage,
    IonTitle,
    IonToolbar,
    IonDatetime,
    IonCheckbox,
    IonDatetimeButton,
    IonModal,
    IonImg,
    IonFab,
    IonFabButton,
    IonIcon
} from '@ionic/react';
import { camera } from 'ionicons/icons';
import { TaskProps } from './TaskProps';
import { usePhotoGallery } from './usePhotoGallery';
import { Geolocation } from '@capacitor/geolocation';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet with Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
    const [position, setPosition] = useState<L.LatLng | null>(null);
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return position === null ? null : (
        <Marker position={position}></Marker>
    );
}

interface TaskEditProps {
    task?: TaskProps;
    onSave: (task: TaskProps) => void;
    onCancel: () => void;
}

const TaskEdit: React.FC<TaskEditProps> = ({ task, onSave, onCancel }) => {
    const [text, setText] = useState(task?.text || '');
    const [description, setDescription] = useState(task?.description || '');
    const [amount, setAmount] = useState<number | undefined>(task?.amount);
    const [date, setDate] = useState<string | undefined>(task?.date);
    const [isCompleted, setIsCompleted] = useState(task?.isCompleted || false);
    const [photo, setPhoto] = useState(task?.photo || '');
    const [lat, setLat] = useState<number | undefined>(task?.lat);
    const [lng, setLng] = useState<number | undefined>(task?.lng);
    const [showMap, setShowMap] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const { takePhoto } = usePhotoGallery();

    const handleTakePhoto = async () => {
        const photoData = await takePhoto();
        if (photoData) {
            setPhoto(photoData);
        }
    };

    const handleOpenMap = async () => {
        setShowMap(true);
        try {
            const position = await Geolocation.getCurrentPosition();
            setCurrentLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude
            });
        } catch (error) {
            console.error('Error getting location', error);
        }
    };

    const handleLocationSelect = (selectedLat: number, selectedLng: number) => {
        setLat(selectedLat);
        setLng(selectedLng);
    };

    const handleSave = () => {
        const editedTask: TaskProps = {
            ...task,
            text,
            description,
            amount,
            date,
            isCompleted,
            photo,
            lat,
            lng
        };
        onSave(editedTask);
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Add Task</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={onCancel}>Cancel</IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <IonItem>
                    <IonLabel position="stacked">Text</IonLabel>
                    <IonInput value={text} onIonChange={e => setText(e.detail.value!)} />
                </IonItem>
                <IonItem>
                    <IonLabel position="stacked">Description</IonLabel>
                    <IonInput value={description} onIonChange={e => setDescription(e.detail.value!)} />
                </IonItem>
                <IonItem>
                    <IonLabel position="stacked">Amount</IonLabel>
                    <IonInput type="number" value={amount} onIonChange={e => setAmount(parseFloat(e.detail.value!))} />
                </IonItem>
                <IonItem>
                    <IonLabel>Date</IonLabel>
                    <IonDatetimeButton datetime="datetime"></IonDatetimeButton>
                    <IonModal keepContentsMounted={true}>
                        <IonDatetime id="datetime" presentation="date" onIonChange={e => setDate(e.detail.value as string)}></IonDatetime>
                    </IonModal>
                </IonItem>
                <IonItem>
                    <IonLabel>Completed</IonLabel>
                    <IonCheckbox checked={isCompleted} onIonChange={e => setIsCompleted(e.detail.checked)} />
                </IonItem>
                <IonItem>
                    {photo && <IonImg src={`data:image/jpeg;base64,${photo}`} />}
                </IonItem>
                <IonItem>
                    <IonLabel>Location: {lat && lng ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'No location selected'}</IonLabel>
                    <IonButton onClick={handleOpenMap}>Select Location</IonButton>
                </IonItem>

                <IonModal isOpen={showMap} onDidDismiss={() => setShowMap(false)}>
                    <IonHeader>
                        <IonToolbar>
                            <IonTitle>Select Location</IonTitle>
                            <IonButtons slot="end">
                                <IonButton onClick={() => setShowMap(false)}>Close</IonButton>
                            </IonButtons>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent>
                        {currentLocation && (
                            <MapContainer center={[currentLocation.lat, currentLocation.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                                <LocationMarker onLocationSelect={handleLocationSelect} />
                                {lat && lng && <Marker position={[lat, lng]} />}
                            </MapContainer>
                        )}
                    </IonContent>
                </IonModal>
                <IonFab vertical="bottom" horizontal="center" slot="fixed">
                    <IonFabButton onClick={handleTakePhoto}>
                        <IonIcon icon={camera} />
                    </IonFabButton>
                </IonFab>
                <div className="ion-padding" style={{ textAlign: 'center' }}>
                    <IonButton expand="block" onClick={handleSave}>Add Task</IonButton>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default TaskEdit;
