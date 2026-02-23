import { useState, useEffect } from 'react';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

export interface UserPhoto {
    filepath: string;
    webviewPath?: string;
}

export function usePhotoGallery() {
    const takePhoto = async () => {
        const photo = await Camera.getPhoto({
            resultType: CameraResultType.Base64,
            source: CameraSource.Camera,
            quality: 100,
        });

        const fileName = new Date().getTime() + '.jpeg';
        const savedFileImage = await savePicture(photo, fileName);
        console.log('savedFileImage', savedFileImage);
        return photo.base64String;
    };

    const savePicture = async (photo: Photo, fileName: string): Promise<UserPhoto> => {
        const base64Data = photo.base64String!;
        // Write the file to the data directory
        const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Data,
        });

        // Use webPath to display the new image instead of base64 since it's already saved
        return {
            filepath: fileName,
            webviewPath: photo.webPath,
        };
    };

    return {
        takePhoto,
    };
}
