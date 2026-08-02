import { useEffect, useRef, useState } from 'react'
import battleIcon from './assets/battle.png'
import coinIcon from './assets/coin.png'
import emberforgeOpponent from './assets/emberforge-clean.png'
import frostpineOpponent from './assets/frostpine-clean.png'
import rubyOpponent from './assets/ruby-clean.png'
import shopIcon from './assets/shop.png'
import sunstoneOpponent from './assets/sunstone-clean.png'
import troopsIcon from './assets/troops.png'
import { ClashVillageMap } from './components/ClashVillageMap'
import { RubyBattleMap } from './components/RubyBattleMap'
import './kingdom-home.css'
import './icon-overrides.css'
import './battle-picker.css'
import './ruby-battle-map.css'
import './leaderboard.css'

type Notice = string | null
type IrisPhase = 'idle' | 'closing' | 'closed' | 'opening'

const HUDButton = ({ label, icon, image, notice, onClick }: { label: string; icon?: string; image?: string; notice?: string; onClick: () => void }) => (
  <button className="kh-dock-item" onClick={onClick} aria-label={label}>
    <span className="kh-dock-icon">{image ? <img src={image} alt="" /> : icon}</span>
    <b>{label}</b>
    {notice && <i>{notice}</i>}
  </button>
)

const BattleLoading = ({ closing, onBack }: { closing: boolean; onBack: () => void }) => (
  <section className={`battle-loading${closing ? ' closing' : ''}`} aria-label="Battle loading screen">
    <div className="battle-sky-shine" />
    <div className="battle-cloud battle-cloud-left"><i /><i /><i /></div>
    <div className="battle-cloud battle-cloud-right"><i /><i /><i /></div>
    <div className="battle-character battle-knight" aria-hidden="true"><span className="battle-helmet">♜</span><span className="battle-face" /><span className="battle-body">⚔</span></div>
    <div className="battle-character battle-scout" aria-hidden="true"><span className="battle-helmet">♞</span><span className="battle-face" /><span className="battle-body">✦</span></div>
    <div className="battle-loading-copy"><p>TOAD RALLY</p><h2>LOADING<span>...</span></h2><small>PREPARING YOUR TROOPS</small></div>
    <button className="battle-back" onClick={onBack}>‹ <span>BACK TO KINGDOM</span></button>
  </section>
)

const opponents = [
  { name: 'Queen Marigold', realm: 'SUNSTONE KINGDOM', level: 17, image: sunstoneOpponent },
  { name: 'Duke Bramble', realm: 'FROSTPINE REALM', level: 19, image: frostpineOpponent },
  { name: 'Lord Cinder', realm: 'EMBERFORGE EMPIRE', level: 21, image: emberforgeOpponent },
  { name: 'Empress Ruby', realm: 'CRIMSON JEWEL', level: 23, image: rubyOpponent },
]

const BattlePicker = ({ onClose, onChoose }: { onClose: () => void; onChoose: (name: string) => void }) => (
  <section className="battle-picker" aria-label="Choose an opponent">
    <div className="battle-picker-panel">
      <button className="battle-picker-close" onClick={onClose} aria-label="Close battle menu">×</button>
      <h2>CHOOSE YOUR RIVAL</h2><p>SELECT A KINGDOM TO CHALLENGE</p>
      <div className="battle-opponents">
        {opponents.map((opponent) => <button className="battle-opponent" key={opponent.name} onClick={() => onChoose(opponent.name)}>
          <figure><img src={opponent.image} alt="" /></figure><b>{opponent.name}</b><small>{opponent.realm}</small><em>LV. {opponent.level}</em>
        </button>)}
      </div>
    </div>
  </section>
)

const leaderboardEntries = [
  ['1', 'NoraNimbus', 'Cloudberry Realm', '26 980'],
  ['2', 'WaffleWarden', 'Golden Grove', '24 610'],
  ['3', 'PixelPanda', 'Pinecone Province', '22 845'],
  ['4', 'King Tubby', 'Toadstool Kingdom', '19 740'],
  ['5', 'MossyMina', 'Mushroom March', '18 960'],
  ['6', 'JellyJoust', 'Starfall Keep', '17 380'],
]

const Leaderboard = ({ onClose }: { onClose: () => void }) => (
  <section className="leaderboard" aria-label="Kingdom leaderboard"><div className="leaderboard-card">
    <button className="leaderboard-close" onClick={onClose} aria-label="Close leaderboard">×</button>
    <header><span>♜</span><div><h2>LEADERBOARD</h2><p>PLAYER CIVILIZATION RANKINGS</p></div></header>
    <div className="leaderboard-tabs"><span>THIS SEASON</span><span>POWER</span><span>FASTEST GROWTH</span></div>
    <div className="leaderboard-list">{leaderboardEntries.map(([rank, player, realm, power]) => <div className={`leaderboard-row${player === 'King Tubby' ? ' you' : ''}`} key={player}>
      <span className="leaderboard-rank">{rank}</span><span className="leaderboard-player"><b>{player}</b><small>{realm}</small></span><span className="leaderboard-score"><b>{power} ★</b></span><button className="leaderboard-trend">VIEW</button>
    </div>)}</div>
    <footer className="leaderboard-foot"><span>YOUR BEST: <b>#4</b></span><span>REFRESHES IN 3h 12m</span></footer>
  </div></section>
)

export default function KingdomHome() {
  const rubyPreview = typeof window !== 'undefined' && window.location.hash === '#ruby'
  const [notice, setNotice] = useState<Notice>(null)
  const [noticeVisible, setNoticeVisible] = useState(false)
  const noticeHideTimer = useRef<number | null>(null)
  const noticeClearTimer = useRef<number | null>(null)
  const [battleLoading, setBattleLoading] = useState(false)
  const [battlePicker, setBattlePicker] = useState(false)
  const [battleOpponent, setBattleOpponent] = useState<string | null>(rubyPreview ? 'Empress Ruby' : null)
  const [rubyBattleMap, setRubyBattleMap] = useState(rubyPreview)
  const [rubyIntroStarted, setRubyIntroStarted] = useState(rubyPreview)
  const [leaderboard, setLeaderboard] = useState(false)
  const [closingBattle, setClosingBattle] = useState(false)
  const [irisPhase, setIrisPhase] = useState<IrisPhase>('idle')
  const show = (message: string) => {
    if (noticeHideTimer.current) window.clearTimeout(noticeHideTimer.current)
    if (noticeClearTimer.current) window.clearTimeout(noticeClearTimer.current)
    setNotice(message)
    setNoticeVisible(true)
    noticeHideTimer.current = window.setTimeout(() => setNoticeVisible(false), 1900)
    noticeClearTimer.current = window.setTimeout(() => setNotice(null), 2160)
  }
  const closeBattle = () => {
    setClosingBattle(true)
    window.setTimeout(() => { setBattleLoading(false); setClosingBattle(false) }, 680)
  }
  const chooseOpponent = (name: string) => {
    setBattlePicker(false)
    setBattleOpponent(name)
    setRubyIntroStarted(false)
    setIrisPhase('closing')
    show(`Marching to face ${name}`)
  }
  useEffect(() => {
    if (irisPhase !== 'closing') return
    const closeTimer = window.setTimeout(() => setIrisPhase('closed'), 620)
    return () => window.clearTimeout(closeTimer)
  }, [irisPhase])
  useEffect(() => {
    if (irisPhase !== 'closed') return
    const mountTimer = window.setTimeout(() => {
      if (battleOpponent === 'Empress Ruby') setRubyBattleMap(true)
      else setBattleLoading(true)
    }, 0)
    const revealTimer = window.setTimeout(() => {
      if (battleOpponent === 'Empress Ruby') setRubyIntroStarted(true)
      setIrisPhase('opening')
    }, 1000)
    return () => { window.clearTimeout(mountTimer); window.clearTimeout(revealTimer) }
  }, [battleOpponent, irisPhase])
  useEffect(() => {
    if (irisPhase !== 'opening') return
    const timer = window.setTimeout(() => setIrisPhase('idle'), 720)
    return () => window.clearTimeout(timer)
  }, [irisPhase])

  return (
    <main className="kingdom-home" aria-label="Kingdom game home">
      <div className="kh-map" aria-label="Interactive kingdom map"><ClashVillageMap /></div>
      <div className="kh-map-vignette" />

      <header className="kh-top-hud">
        <button className="kh-player" onClick={() => show('King Tubby — level 18')}>
          <span className="kh-crown">♛</span><span><b>18</b><em>KING TUBBY</em></span>
        </button>
        <div className="kh-resources">
          <button className="kh-resource kh-gold" onClick={() => show('18,420 coins in the royal vault')}><span><img src={coinIcon} alt="" /></span><b>18 420</b><strong>+</strong></button>
        </div>
        <div className="kh-header-actions">
          <button onClick={() => show('Music toggled')} aria-label="Toggle music">♫</button>
          <button onClick={() => show('Settings coming soon')} aria-label="Open settings">⚙</button>
        </div>
      </header>

      <aside className="kh-quest">
        <p>TODAY'S QUEST</p>
        <div><span>!</span><section><b>Super Sprint</b><small>Win 3 Toad Rally battles</small></section></div>
        <footer><i /><b>2/3</b></footer>
      </aside>

      <section className="kh-kingdom-card">
        <span className="kh-flag">★</span><p>MY KINGDOM</p><h1>TOADSTOOL<br />KINGDOM</h1>
      </section>

      <aside className="kh-event">
        <div>?</div><section><small>WEEKEND EVENT</small><b>BOB-OMB<br />BONANZA!</b><em>2d 14h</em></section>
        <button onClick={() => show('Bob-omb Bonanza selected')} aria-label="Open event">›</button>
      </aside>

      <aside className="kh-map-key" aria-label="Landmark key">
        <b>MAP KEY</b>
        <div><span>A</span> Castle <span>B</span> Well <span>C</span> Farm <span>D</span> Windmill</div>
        <div><span>E</span> Stable <span>F</span> Market</div>
        <div><span>H</span> Blue storage <span>I</span> Forge <span>J</span> Depot</div>
        <div><span>L–N</span> Watch posts <span>CF</span> Campfire</div>
        <div><span>H1–H13</span> Homes <span>S2–S3</span> Stores</div>
        <div><span>O1</span> Farm cottage <span>P1–P4</span> Signs <span>T1–T6</span> Lamps</div>
      </aside>

      <nav className="kh-dock" aria-label="Game actions">
        <HUDButton label="SHOP" image={shopIcon} onClick={() => show('Shop selected')} />
        <HUDButton label="TROOPS" image={troopsIcon} notice="3" onClick={() => show('Three troops are ready')} />
        <button className="kh-battle" onClick={() => setBattlePicker(true)}><img className="kh-battle-icon" src={battleIcon} alt="" /><b>BATTLE!</b><small>TOAD RALLY</small></button>
        <HUDButton label="FRIENDS" icon="♛" notice="1" onClick={() => show('One friend request')} />
        <HUDButton label="LEADERBOARD" icon="♜" onClick={() => setLeaderboard(true)} />
      </nav>
      <div className={`kh-toast${noticeVisible ? ' visible' : ''}`} role="status">{notice}</div>
      {battlePicker && <BattlePicker onClose={() => setBattlePicker(false)} onChoose={chooseOpponent} />}
      {leaderboard && <Leaderboard onClose={() => setLeaderboard(false)} />}
      {battleLoading && <BattleLoading closing={closingBattle} onBack={closeBattle} />}
      {rubyBattleMap && <RubyBattleMap startIntro={rubyIntroStarted} onBack={() => { setRubyBattleMap(false); setRubyIntroStarted(false); setBattleOpponent(null) }} />}
      {irisPhase !== 'idle' && <div className={`battle-iris ${irisPhase}`} aria-hidden="true" />}
    </main>
  )
}
