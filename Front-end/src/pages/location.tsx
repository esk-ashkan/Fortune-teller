import { useGeolocation } from "@uidotdev/usehooks";

export default function Location() {
  const state = useGeolocation();

  if (state.loading) {
    return <p>loading... (you may need to enable permissions)</p>;
  }

  if (state.error) {
    return <p>Enable permissions to access your location data</p>;
  }
}