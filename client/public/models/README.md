# Modèle 3D du croupier

Dépose ici le fichier du croupier : **`dealer.glb`**

- Chemin exact attendu : `client/public/models/dealer.glb`
- Format : **.glb** (GLTF binaire, un seul fichier) — de préférence < ~10 Mo
- Tant que le fichier est absent, un buste stylisé de repli s'affiche (aucun crash).
- Une fois déposé, il apparaît automatiquement ; on ajustera ensuite
  position / échelle / rotation dans `client/src/app/blackjack/3d/Dealer3D.tsx`.

## Où trouver un .glb gratuit

- **Ready Player Me** (le plus simple) : https://readyplayer.me — crée un avatar
  (mets-lui un costume), puis « Download » → tu obtiens un `.glb` optimisé web.
- **Sketchfab** : https://sketchfab.com — cherche « dealer », « croupier »,
  « bartender », « businessman » ; filtre *Downloadable* + licence gratuite (CC),
  télécharge le **GLB**.
- **Poly Pizza** : https://poly.pizza — modèles low-poly gratuits, export GLB.
- **Mixamo** (Adobe, gratuit) : https://mixamo.com — personnages riggés, mais
  export FBX → à convertir en GLB (ex. via https://gltf.report ou Blender).
