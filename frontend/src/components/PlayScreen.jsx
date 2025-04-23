import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

const PlayScreen = () => {
  const { session_id } = useParams();
  const [stage, setStage] = useState('loading');
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState(null);
  const [position, setPosition] = useState(-1);
  const [lastKnownPosition, setLastKnownPosition] = useState(-2);

  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState([]);
  const [durationLeft, setTimeLeft] = useState(null);
  const [questionFetched, setQuestionFetched] = useState(false);

  const fetchStatus = async () => {
    if (!playerId) return;
    const res = await fetch(`http://localhost:5005/play/${playerId}/status`);
    const data = await res.json();

    if (res.ok) {
      const newPosition = data.position;
      setPosition(newPosition);

      if (newPosition === -1) {
        setStage('waiting');
        setQuestionFetched(false);
        setTimeLeft(null);
      } else if (newPosition !== lastKnownPosition) {
        console.log('🎯 New question incoming...');
        setLastKnownPosition(newPosition);
        setQuestionFetched(false);
        setTimeout(fetchQuestion, 1000); // 1 秒后 fetch 新题
      }
    }
  };

  const fetchQuestion = async () => {
    if (!playerId || questionFetched) return;

    const res = await fetch(`http://localhost:5005/play/${playerId}/question`);
    if (!res.ok) {
      const errorText = await res.text();
      console.warn('fetchQuestion failed:', errorText);
      return;
    }

    const data = await res.json();
    const q = data.question;

    console.log('✅ Fetched Question:', q);

    setQuestion(q);
    setQuestionFetched(true);
    setSelected([]);

    const start = new Date(q.isoTimeLastQuestionStarted);
    const now = new Date();
    const secondsPassed = Math.floor((now - start) / 1000);
    const remaining = q.duration - secondsPassed;

    setTimeLeft(remaining > 0 ? remaining : 0);
    setStage('question');
  };


  const submitAnswer = async (answerIds) => {
    if (!playerId || !answerIds || answerIds.length === 0) return;

    const res = await fetch(`http://localhost:5005/play/${playerId}/answer`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: answerIds }),  // ✅ 注意是 answers
    });

    const data = await res.json();
    if (!res.ok) {
      console.warn('❌ Submit error:', data);
    }
  };


  const joinSession = async () => {
    const res = await fetch(`http://localhost:5005/play/join/${session_id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: playerName }),
    });

    const data = await res.json();
    if (res.ok) {
      setPlayerId(data.playerId);
      setStage('waiting');
    } else {
      alert(data.error || 'Failed to join session');
    }
  };

  useEffect(() => {
    if (!playerId) {
      setStage('join');
    } else {
      fetchStatus();
      const interval = setInterval(fetchStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [playerId]);

  useEffect(() => {
    if (stage === 'question' && durationLeft !== null && durationLeft > 0) {
      const t = setTimeout(() => setTimeLeft(durationLeft - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [durationLeft, stage]);

  if (stage === 'loading') return <p>Loading...</p>;

  if (stage === 'join') {
    return (
      <div style={{ padding: 40 }}>
        <h2>Join Game</h2>
        <input
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
        <button onClick={joinSession}>Join</button>
      </div>
    );
  }

  if (stage === 'waiting') {
    return (
      <div style={{ padding: 40 }}>
        <h2>Please wait for the game to start...</h2>
      </div>
    );
  }

  if (stage === 'question') {
    if (!question || !question.question || !Array.isArray(question.optionAnswers)) {
      return <p>Waiting for question data...</p>;
    }

    return (
      <div style={{ padding: 40 }}>
        <h2>{question.question}</h2>
        {question.image && <img src={question.image} alt="question" style={{ maxWidth: '100%' }} />}
        {question.video && <video src={question.video} controls style={{ maxWidth: '100%' }} />}
        <p>Duration left: {durationLeft}s</p>
        <div>
          {question.optionAnswers.map((ans, idx) => (
            <button
              key={ans.text}
              onClick={() => {
                const value = idx;  // ✅ 改成索引
                const newSelected = question.type === 'multiple'
                  ? selected.includes(value)
                    ? selected.filter(i => i !== value)
                    : [...selected, value]
                  : [value];

                setSelected(newSelected);
                console.log('✅ Submit these IDs to backend:', newSelected);
                submitAnswer(newSelected); // ✅ 提交 index 数组
              }}
              style={{
                background: selected.includes(idx) ? '#90ee90' : '',
                margin: '5px',
                padding: '10px',
              }}
            >
              {ans.text}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default PlayScreen;
