import './App.css';
import { Route, Routes } from 'react-router-dom';
import LobyScreen from './screens/Lobby';
import RoomPage from './screens/Room';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path='/' element={<LobyScreen/>}/>
        <Route path='/room/:roomId' element={<RoomPage/>}/>
      </Routes>
    </div>
  );
}

export default App;
