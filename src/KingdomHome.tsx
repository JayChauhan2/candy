import { useState } from 'react'
import battleIcon from './assets/battle.png'
import coinIcon from './assets/coin.png'
import gemIcon from './assets/gem.png'
import journalIcon from './assets/journal.png'
import shopIcon from './assets/shop.png'
import starIcon from './assets/star.png'
import troopsIcon from './assets/troops.png'
import { ClashVillageMap } from './components/ClashVillageMap'
import './kingdom-home.css'
import './icon-overrides.css'

type Notice = string | null

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

export default function KingdomHome() {
  const [notice, setNotice] = useState<Notice>(null)
  const [battleLoading, setBattleLoading] = useState(false)
  const [closingBattle, setClosingBattle] = useState(false)
  const show = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(null), 1900)
  }
  const closeBattle = () => {
    setClosingBattle(true)
    window.setTimeout(() => { setBattleLoading(false); setClosingBattle(false) }, 680)
  }

  return (
    <main className="kingdom-home" aria-label="Kingdom game home">
      <div className="kh-map" aria-label="Interactive kingdom map"><ClashVillageMap /></div>
      <div className="kh-map-vignette" />

      <header className="kh-top-hud">
        <button className="kh-player" onClick={() => show('King Tubby — level 18')}>
          <span className="kh-crown">♛</span><span><b>18</b><em>KING TUBBY</em></span>
        </button>
        <div className="kh-resources">
          <button className="kh-resource kh-gold" onClick={() => show('18,420 coins in the royal vault')}><span><img src={coinIcon} alt="" /></span><small>COINS</small><b>18 420</b><strong>+</strong></button>
          <button className="kh-resource kh-gems" onClick={() => show('Gem shop coming soon')}><span><img src={gemIcon} alt="" /></span><small>GEMS</small><b>1 280</b><strong>+</strong></button>
          <button className="kh-resource kh-stars" onClick={() => show('74 Power Stars collected')}><span><img src={starIcon} alt="" /></span><small>STARS</small><b>74</b><strong>+</strong></button>
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
        <div className="kh-castle" aria-hidden="true"><i /><i /><i /><b /></div>
        <footer><span /> ALL SYSTEMS HAPPY!</footer>
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
        <div><span>H1–H13</span> Homes <span>S1–S3</span> Stores</div>
        <div><span>O1</span> Farm cottage <span>P1–P4</span> Signs <span>T1–T6</span> Lamps</div>
      </aside>

      <nav className="kh-dock" aria-label="Game actions">
        <HUDButton label="SHOP" image={shopIcon} onClick={() => show('Shop selected')} />
        <HUDButton label="TROOPS" image={troopsIcon} notice="3" onClick={() => show('Three troops are ready')} />
        <button className="kh-battle" onClick={() => setBattleLoading(true)}><img className="kh-battle-icon" src={battleIcon} alt="" /><b>BATTLE!</b><small>TOAD RALLY</small></button>
        <HUDButton label="FRIENDS" icon="♛" notice="1" onClick={() => show('One friend request')} />
        <HUDButton label="JOURNAL" image={journalIcon} onClick={() => show('Kingdom journal selected')} />
      </nav>
      <div className={`kh-toast${notice ? ' visible' : ''}`} role="status">{notice}</div>
      {battleLoading && <BattleLoading closing={closingBattle} onBack={closeBattle} />}
    </main>
  )
}
