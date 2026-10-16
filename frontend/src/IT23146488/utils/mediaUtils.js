import { Alert, Platform, Share } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';

/**
 * Resolves an image source (number require, remote URL, or local file URI)
 * to a local file URI on the device filesystem.
 */
async function resolveLocalImageUri(imageSource, fallbackFilename = 'gemvision-design.png') {
  if (!imageSource) return null;

  // 1. If it's a number (React Native require asset)
  if (typeof imageSource === 'number') {
    try {
      const asset = Asset.fromModule(imageSource);
      await asset.downloadAsync();
      return asset.localUri || asset.uri;
    } catch (err) {
      console.warn('Could not download asset module:', err);
    }
  }

  const uri = typeof imageSource === 'string' ? imageSource : imageSource?.uri;
  if (!uri) return null;

  // 2. If it's already a local file:// URI
  if (uri.startsWith('file://')) {
    return uri;
  }

  // 3. If it's a remote http/https URL, download to cache directory
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    try {
      const filename = `${Date.now()}-${fallbackFilename}`;
      const targetPath = `${FileSystem.cacheDirectory}${filename}`;
      const downloadResult = await FileSystem.downloadAsync(uri, targetPath);
      return downloadResult.uri;
    } catch (err) {
      console.warn('Could not download remote image:', err);
      return uri;
    }
  }

  return uri;
}

/**
 * Saves a design image directly to the phone's photo library / gallery,
 * with fallbacks for permissions, sharing, or web downloads.
 */
export async function saveImageToPhone(imageSource, filename = 'gemvision-design.png') {
  try {
    // Web platform handling
    if (Platform.OS === 'web') {
      const uri = typeof imageSource === 'string' ? imageSource : imageSource?.uri;
      if (uri) {
        const link = document.createElement('a');
        link.href = uri;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return { success: true, message: 'Image downloaded successfully.' };
      }
      return { success: false, message: 'Image source is unavailable.' };
    }

    // Native mobile handling (iOS / Android)
    const localUri = await resolveLocalImageUri(imageSource, filename);
    if (!localUri) {
      return { success: false, message: 'Unable to locate image file.' };
    }

    // Request permissions for saving to media library
    const { status } = await MediaLibrary.requestPermissionsAsync(true);

    if (status === 'granted') {
      try {
        await MediaLibrary.saveToLibraryAsync(localUri);
        return {
          success: true,
          message: 'Design saved successfully to your phone photo gallery!',
        };
      } catch (saveErr) {
        console.warn('MediaLibrary.saveToLibraryAsync fallback to createAsset:', saveErr);
        try {
          await MediaLibrary.createAssetAsync(localUri);
          return {
            success: true,
            message: 'Design saved successfully to your phone photo gallery!',
          };
        } catch (createErr) {
          console.warn('createAssetAsync failed, falling back to share sheet:', createErr);
        }
      }
    }

    // Fallback: If permission was denied or saving direct to gallery failed, use native Sharing
    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (isSharingAvailable) {
      await Sharing.shareAsync(localUri, {
        dialogTitle: 'Save or Share Jewelry Design',
        mimeType: 'image/png',
        UTI: 'public.png',
      });
      return {
        success: true,
        message: 'Share sheet opened — you can save directly to your photos.',
      };
    }

    return {
      success: false,
      message: 'Photo library permission was not granted.',
    };
  } catch (error) {
    console.error('saveImageToPhone error:', error);
    return {
      success: false,
      message: error?.message || 'Failed to save image to phone.',
    };
  }
}

/**
 * Opens system share sheet for the jewelry design image.
 */
export async function shareDesignImage(imageSource, message = 'Check out my custom jewelry design from GemVision!') {
  try {
    const localUri = await resolveLocalImageUri(imageSource, 'gemvision-design.png');
    if (!localUri) {
      await Share.share({ message });
      return;
    }

    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (isSharingAvailable && Platform.OS !== 'web') {
      await Sharing.shareAsync(localUri, {
        dialogTitle: 'Share Jewelry Design',
        mimeType: 'image/png',
      });
    } else {
      await Share.share({
        message: `${message}\n${localUri}`,
        url: localUri,
      });
    }
  } catch (error) {
    console.error('shareDesignImage error:', error);
    Alert.alert('Share Failed', 'Unable to share image at this time.');
  }
}
