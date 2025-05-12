import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home({ socket }) {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/lobby');
  }, [navigate]);

  return null; // or you can return a loading screen if needed
}
