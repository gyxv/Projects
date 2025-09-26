# 🎲 3D Crossword Cube

A revolutionary 3D crossword puzzle game where words are hidden in a three-dimensional cube! Navigate through the cube to find words placed horizontally, vertically, diagonally, and in true 3D space.

## ✨ Features

### 🎮 Core Gameplay
- **Dynamic Cube Generation**: Cube size automatically adjusts based on your longest word
- **Multi-Directional Word Placement**: Words can appear in 26 different directions (all 3D orientations)
- **Interactive Letter Selection**: Click letters to select and form words
- **Real-time Scoring**: Earn points for each word found
- **Progress Tracking**: Visual progress bar showing completion status

### 🎯 Word Placement Types
- **2D Surface Words**: 
  - Horizontal on cube faces
  - Vertical on cube faces  
  - Diagonal on cube faces
- **3D Space Words**: Words that span across multiple cube faces and through the interior

### 🎨 Visual Features
- **Modern 3D Graphics**: Powered by Three.js for smooth 3D rendering
- **Glassmorphism UI**: Beautiful transparent interface panels
- **Interactive Animations**: Letters animate when words are found
- **Wireframe Mode**: Toggle cube framework visualization
- **Dynamic Lighting**: Ambient and directional lighting for depth

### 🕹️ Navigation Controls
- **Mouse Controls**:
  - Left-click + drag: Rotate the cube
  - Right-click + drag: Pan around the cube
  - Scroll wheel: Zoom in/out
  - Click letters: Select for word formation
- **Keyboard Shortcuts**:
  - `R`: Reset camera view
  - `W`: Toggle wireframe mode
  - `Escape`: Clear current selection

## 🚀 How to Play

### 1. Setup Your Puzzle
1. Enter your words in the input box (comma or line separated)
2. Optionally set a specific cube size (or let it auto-calculate)
3. Click "Generate 3D Cube"

### 2. Navigate the Cube
- Use mouse controls to rotate, zoom, and pan
- Explore all faces and the interior of the cube
- Look for letter patterns that form your words

### 3. Find Words
- Click individual letters to select them
- Selected letters will highlight in blue
- When you complete a valid word, it will animate and turn green
- Found words are marked in the word list

### 4. Win the Game
Find all hidden words to complete the puzzle and earn your final score!

## 🎯 Game Mechanics

### Word Placement Algorithm
The system uses an intelligent algorithm that:
1. Determines optimal cube size based on word lengths
2. Places words in random 3D orientations
3. Handles word intersections and conflicts
4. Fills empty spaces with random letters

### Scoring System
- **100 points** per word found
- **Progress tracking** shows completion percentage
- **Real-time updates** as you find words

### Difficulty Scaling
- Larger cubes = more challenging navigation
- More words = higher complexity
- 3D word placement increases difficulty significantly

## 💡 Pro Tips

### Finding Words Effectively
1. **Rotate Frequently**: Words might be hidden on faces you haven't explored
2. **Look Inside**: Some words span through the cube's interior
3. **Check All Orientations**: Words can be read forwards, backwards, and diagonally
4. **Use Wireframe Mode**: Toggle wireframe to see the cube structure clearly
5. **Systematic Search**: Check each face methodically before moving to 3D words

### Optimal Word Lists
- **Mix word lengths**: Variety creates more interesting cube shapes
- **Use 4-8 letter words**: Ideal for most cube sizes
- **Avoid repetitive letters**: More variety = better placement opportunities

## 🔧 Technical Details

### Technologies Used
- **Three.js**: 3D graphics rendering and scene management
- **OrbitControls**: Camera navigation and interaction
- **Canvas API**: Dynamic letter texture generation
- **Raycasting**: Precise 3D object selection

### Performance Optimizations
- **Efficient geometry disposal**: Prevents memory leaks
- **Optimized raycasting**: Smooth interaction even with large cubes
- **Texture caching**: Reuses letter textures for better performance
- **LOD considerations**: Adaptive quality based on distance

### Browser Compatibility
- Modern browsers with WebGL support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers supported with touch controls

## 🎨 Customization Options

### Visual Settings
- **Auto-rotate**: Automatically rotate the cube
- **Wireframe toggle**: Show/hide cube framework
- **Custom cube sizes**: Override automatic sizing
- **Color themes**: Easily modifiable in CSS

### Gameplay Variants
- **Timed challenges**: Add time pressure (easily implementable)
- **Hint systems**: Highlight first letters (future enhancement)
- **Difficulty levels**: Predefined word sets and cube sizes

## 🚧 Future Enhancements

### Planned Features
- **Multiplayer mode**: Compete to find words first
- **Word categories**: Themed puzzles (animals, science, etc.)
- **Hint system**: Progressive clues for stuck players
- **Save/Load puzzles**: Share favorite configurations
- **Statistics tracking**: Personal best times and scores
- **VR support**: Immersive 3D crossword experience

### Technical Improvements
- **WebWorker integration**: Offload cube generation for larger puzzles
- **Better collision detection**: More precise word placement
- **Procedural word generation**: AI-generated themed word lists
- **Cloud saves**: Sync progress across devices

## 🤝 Contributing

This project is open for enhancements! Some areas for contribution:
- Algorithm improvements for word placement
- UI/UX enhancements
- Performance optimizations
- New game modes and features
- Bug fixes and testing

## 📄 License

This project is open source and available under the MIT License.

---

**Enjoy exploring words in three dimensions! 🎲✨**
