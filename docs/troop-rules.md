# Troop movement and capture rules

This document defines the deterministic battle rules used by the kingdom maps. It is intentionally separate from the future AI implementation so a queen agent can read the same game state and rules as the player.

## Locations and production

- Homes produce one troop for their current owner every 30 seconds while a battle is active.
- Player-owned troops are blue. Ruby-owned troops are red.
- Outposts do not produce troops; they are staging locations.
- A captured home changes to the player's kingdom model and subsequently produces blue troops.

## Valid player routes

- From a home, troops may move only to a player-owned outpost or the player castle.
- From an outpost, troops may move to another player-owned outpost, the player castle, or any Ruby-controlled monument.
- From the player castle, troops may move to player outposts or any Ruby-controlled monument. Player homes are not valid castle destinations.

## Combat and capture

- Troops travel visibly to their destination.
- If an arriving troop reaches a monument occupied by the opposing side, one attacker and one defender are removed.
- This resolution happens per arrival. For example, three red attackers arriving at a monument with two blue defenders leave one red troop.
- When a monument has no defenders, the next surviving attacker occupies it and changes its ownership.
- When blue troops capture a Ruby home or outpost, it is rebuilt with the matching blue kingdom model. Captured homes begin blue troop production on the next production interval.
