// PlayScreen.jsx
import { useParams } from 'react-router-dom';

const PlayScreen = () => {
  const { session_id } = useParams();

  return (
    <div style={{ padding: 40 }}>
      <h2>Play Session</h2>
      <p>Session ID: {session_id}</p>
      {/* 后续添加 join、答题等逻辑 */}
    </div>
  );
};

export default PlayScreen;
