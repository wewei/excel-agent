import ExcelSheet from './components/ExcelSheet'

function App() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ExcelSheet onChange={(change) => {
        console.log(change);
      }} />
    </div>
  )
}

export default App
