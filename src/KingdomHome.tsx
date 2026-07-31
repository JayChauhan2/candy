import { useState } from 'react'
import { ClashVillageMap } from './components/ClashVillageMap'
import './kingdom-home.css'

type Notice = string | null

const HUDButton = ({ label, icon, notice, onClick }: { label: string; icon: string; notice?: string; onClick: () => void }) => (
  <button className="kh-dock-item" onClick={onClick} aria-label={label}>
    <span className="kh-dock-icon">{icon}</span>
    <b>{label}</b>
    {notice && <i>{notice}</i>}
  </button>
)

export default function KingdomHome() {
  const [notice, setNotice] = useState<Notice>(null)
  const show = (message: string) => {
    setNotice(message)
    window.setTimeout(() => setNotice(null), 1900)
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
          <button className="kh-resource kh-gold" onClick={() => show('18,420 coins in the royal vault')}><span>●</span><small>COINS</small><b>18 420</b><strong>+</strong></button>
          <button className="kh-resource kh-gems" onClick={() => show('Gem shop coming soon')}><span>◆</span><small>GEMS</small><b>1 280</b><strong>+</strong></button>
          <button className="kh-resource kh-stars" onClick={() => show('74 Power Stars collected')}><span>★</span><small>STARS</small><b>74</b><strong>+</strong></button>
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
        <div><span>E</span> Stable <span>F</span> Market <span>G</span> Barracks</div>
        <div><span>H</span> Blue storage <span>I</span> Forge <span>J</span> Depot</div>
        <div><span>K–N</span> Watch posts</div>
      </aside>

      <nav className="kh-dock" aria-label="Game actions">
        <HUDButton label="SHOP" icon="⌂" onClick={() => show('Shop selected')} />
        <HUDButton label="TROOPS" icon="♟" notice="3" onClick={() => show('Three troops are ready')} />
        <button className="kh-battle" onClick={() => show('Toad Rally is ready for battle!')}><span>⚔</span><b>BATTLE!</b><small>TOAD RALLY</small></button>
        <HUDButton label="FRIENDS" icon="♛" notice="1" onClick={() => show('One friend request')} />
        <HUDButton label="JOURNAL" icon="▤" onClick={() => show('Kingdom journal selected')} />
      </nav>
      <div className={`kh-toast${notice ? ' visible' : ''}`} role="status">{notice}</div>
    </main>
  )
}
