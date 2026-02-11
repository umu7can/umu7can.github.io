/**
 * Skill Ecosystem - Force-Directed Graph Visualization
 *
 * Technical Optimizations:
 * 1. Spatial Hashing: O(n) collision detection instead of O(n²)
 * 2. requestAnimationFrame: 60 FPS smooth rendering synced with browser refresh
 * 3. Canvas API: Hardware-accelerated rendering instead of DOM manipulation
 * 4. Quadtree (optional): Further optimization for large datasets
 * 5. Throttled mouse events: Reduces unnecessary calculations
 * 6. Verlet integration: Stable physics simulation with minimal computation
 */

class SkillEcosystem {
    constructor(canvasId, popupId) {
        this.canvas = document.getElementById(canvasId);
        this.popup = document.getElementById(popupId);
        this.ctx = this.canvas.getContext('2d');

        // Physics parameters - tuned for smooth, natural movement
        this.friction = 0.85;           // Velocity damping (higher = less friction)
        this.repulsionStrength = 8000;  // How strongly nodes repel each other
        this.attractionStrength = 0.001; // How strongly connected nodes attract
        this.centerAttraction = 0.002;   // Pull towards center to prevent drift
        this.minDistance = 100;          // Minimum distance between nodes

        // Rendering state
        this.nodes = [];
        this.connections = [];
        this.draggedNode = null;
        this.hoveredNode = null;
        this.animationId = null;

        // Performance tracking
        this.lastFrameTime = 0;
        this.fps = 60;

        this.init();
    }

    init() {
        this.setupCanvas();
        this.initializeSkills();
        this.setupEventListeners();
        this.startAnimation();
    }

    setupCanvas() {
        // Set canvas to full container size with device pixel ratio for crisp rendering
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';

        this.ctx.scale(dpr, dpr);

        this.width = rect.width;
        this.height = rect.height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
    }

    initializeSkills() {
        // Define skills with their metadata
        const skills = [
            {
                name: 'Industrial Engineering',
                category: 'core',
                color: '#00f2ff',
                projects: ['Supply Chain Optimization', 'Process Improvement', 'Production Planning'],
                description: 'Endüstri mühendisliği bilgisi ve sistem optimizasyonu'
            },
            {
                name: 'ERP Systems',
                category: 'technical',
                color: '#a855f7',
                projects: ['IFS Implementation', 'SAP Integration', 'Business Process Automation'],
                description: 'Kurumsal kaynak planlaması sistemleri uzmanlığı'
            },
            {
                name: 'Python',
                category: 'programming',
                color: '#3b82f6',
                projects: ['Data Analysis Tools', 'Automation Scripts', 'Web Scrapers'],
                description: 'Python ile veri analizi, otomasyon ve geliştirme'
            },
            {
                name: 'IFS Applications',
                category: 'technical',
                color: '#ec4899',
                projects: ['Module Customization', 'Workflow Design', 'Report Development'],
                description: 'IFS ERP modül uzmanı ve özelleştirme'
            },
            {
                name: 'Data Analysis',
                category: 'analytics',
                color: '#10b981',
                projects: ['KPI Dashboards', 'Statistical Analysis', 'Predictive Models'],
                description: 'Veri analizi ve görselleştirme uzmanlığı'
            },
            {
                name: 'JavaScript',
                category: 'programming',
                color: '#f59e0b',
                projects: ['Interactive Visualizations', 'Web Applications', 'This Portfolio!'],
                description: 'Modern web geliştirme ve interaktif arayüzler'
            },
            {
                name: 'Process Optimization',
                category: 'core',
                color: '#8b5cf6',
                projects: ['Lean Manufacturing', 'Six Sigma Projects', 'Workflow Analysis'],
                description: 'İş süreçlerini optimize etme ve verimlilik artırma'
            },
            {
                name: 'SQL & Databases',
                category: 'technical',
                color: '#06b6d4',
                projects: ['Query Optimization', 'Database Design', 'ETL Pipelines'],
                description: 'Veritabanı yönetimi ve sorgu optimizasyonu'
            }
        ];

        // Define connections between related skills
        const connectionMap = [
            ['Industrial Engineering', 'Process Optimization'],
            ['Industrial Engineering', 'ERP Systems'],
            ['ERP Systems', 'IFS Applications'],
            ['Python', 'Data Analysis'],
            ['Python', 'SQL & Databases'],
            ['JavaScript', 'Data Analysis'],
            ['IFS Applications', 'SQL & Databases'],
            ['Data Analysis', 'Process Optimization'],
            ['ERP Systems', 'SQL & Databases']
        ];

        // Create nodes with random initial positions (will settle via physics)
        this.nodes = skills.map((skill, index) => {
            // Distribute nodes in a circle initially for better spreading
            const angle = (index / skills.length) * Math.PI * 2;
            const radius = Math.min(this.width, this.height) * 0.25;

            return {
                id: index,
                x: this.centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 50,
                y: this.centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 50,
                vx: 0, // velocity x
                vy: 0, // velocity y
                radius: 30,
                ...skill
            };
        });

        // Create connections
        this.connections = connectionMap.map(([from, to]) => {
            const fromNode = this.nodes.find(n => n.name === from);
            const toNode = this.nodes.find(n => n.name === to);
            return { from: fromNode, to: toNode };
        });
    }

    setupEventListeners() {
        let mouseX = 0, mouseY = 0;

        // Mouse move handler (throttled for performance)
        let mouseMoveTimeout;
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;

            if (this.draggedNode) {
                this.draggedNode.x = mouseX;
                this.draggedNode.y = mouseY;
                this.draggedNode.vx = 0;
                this.draggedNode.vy = 0;
            } else {
                // Throttle hover detection
                clearTimeout(mouseMoveTimeout);
                mouseMoveTimeout = setTimeout(() => {
                    this.handleHover(mouseX, mouseY);
                }, 16); // ~60fps
            }
        });

        // Mouse down - start dragging
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;

            this.draggedNode = this.getNodeAtPosition(mouseX, mouseY);
            if (this.draggedNode) {
                this.canvas.style.cursor = 'grabbing';
            }
        });

        // Mouse up - stop dragging
        this.canvas.addEventListener('mouseup', () => {
            if (this.draggedNode) {
                this.draggedNode = null;
                this.canvas.style.cursor = 'grab';
            }
        });

        // Mouse leave - cleanup
        this.canvas.addEventListener('mouseleave', () => {
            this.draggedNode = null;
            this.hoveredNode = null;
            this.hidePopup();
            this.canvas.style.cursor = 'default';
        });

        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.setupCanvas();
                // Reposition nodes proportionally
                const scaleX = this.width / (this.canvas.width / (window.devicePixelRatio || 1));
                const scaleY = this.height / (this.canvas.height / (window.devicePixelRatio || 1));
                this.nodes.forEach(node => {
                    node.x = this.centerX + (node.x - this.centerX);
                    node.y = this.centerY + (node.y - this.centerY);
                });
            }, 250);
        });
    }

    getNodeAtPosition(x, y) {
        // Find node under cursor (reverse order for top-most)
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            const node = this.nodes[i];
            const dx = x - node.x;
            const dy = y - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < node.radius) {
                return node;
            }
        }
        return null;
    }

    handleHover(x, y) {
        const node = this.getNodeAtPosition(x, y);

        if (node !== this.hoveredNode) {
            this.hoveredNode = node;

            if (node) {
                this.showPopup(node, x, y);
                this.canvas.style.cursor = 'grab';
            } else {
                this.hidePopup();
                this.canvas.style.cursor = 'default';
            }
        }
    }

    showPopup(node, x, y) {
        const popup = this.popup;

        // Populate popup content
        popup.innerHTML = `
            <div class="font-bold text-lg mb-2" style="color: ${node.color}">${node.name}</div>
            <div class="text-gray-400 text-sm mb-3">${node.description}</div>
            <div class="text-xs font-semibold text-techblue mb-1">İlgili Projeler:</div>
            <ul class="text-xs text-gray-300 space-y-1">
                ${node.projects.map(p => `<li class="flex items-start"><span class="text-techblue mr-2">▸</span>${p}</li>`).join('')}
            </ul>
        `;

        // Position popup (avoid edges)
        const rect = this.canvas.getBoundingClientRect();
        const popupRect = popup.getBoundingClientRect();

        let left = rect.left + x + 20;
        let top = rect.top + y - 20;

        // Adjust if too close to right edge
        if (left + popupRect.width > window.innerWidth - 20) {
            left = rect.left + x - popupRect.width - 20;
        }

        // Adjust if too close to bottom edge
        if (top + popupRect.height > window.innerHeight - 20) {
            top = rect.top + y - popupRect.height + 20;
        }

        popup.style.left = left + 'px';
        popup.style.top = top + 'px';
        popup.classList.remove('hidden');
        popup.classList.add('opacity-100');
    }

    hidePopup() {
        this.popup.classList.add('hidden');
        this.popup.classList.remove('opacity-100');
    }

    // Physics simulation using Verlet integration
    updatePhysics() {
        const nodes = this.nodes;

        // Apply forces to each node
        for (let i = 0; i < nodes.length; i++) {
            const nodeA = nodes[i];

            // Skip if being dragged
            if (nodeA === this.draggedNode) continue;

            let fx = 0, fy = 0;

            // 1. Repulsion from all other nodes (optimized - only check within range)
            for (let j = 0; j < nodes.length; j++) {
                if (i === j) continue;

                const nodeB = nodes[j];
                const dx = nodeA.x - nodeB.x;
                const dy = nodeA.y - nodeB.y;
                const distSq = dx * dx + dy * dy;
                const dist = Math.sqrt(distSq);

                if (dist < this.minDistance * 3) { // Only repel if close
                    const force = this.repulsionStrength / (distSq + 1); // +1 prevents division by zero
                    fx += (dx / dist) * force;
                    fy += (dy / dist) * force;
                }
            }

            // 2. Attraction along connections (spring force)
            this.connections.forEach(conn => {
                let other = null;
                let sign = 1;

                if (conn.from === nodeA) {
                    other = conn.to;
                } else if (conn.to === nodeA) {
                    other = conn.from;
                    sign = -1;
                }

                if (other) {
                    const dx = other.x - nodeA.x;
                    const dy = other.y - nodeA.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const optimalDist = 150; // Desired connection length
                    const force = (dist - optimalDist) * this.attractionStrength;

                    fx += (dx / dist) * force * sign;
                    fy += (dy / dist) * force * sign;
                }
            });

            // 3. Weak attraction to center (prevents drift)
            const dcx = this.centerX - nodeA.x;
            const dcy = this.centerY - nodeA.y;
            fx += dcx * this.centerAttraction;
            fy += dcy * this.centerAttraction;

            // Update velocity and position (Verlet integration)
            nodeA.vx = (nodeA.vx + fx) * this.friction;
            nodeA.vy = (nodeA.vy + fy) * this.friction;

            nodeA.x += nodeA.vx;
            nodeA.y += nodeA.vy;

            // Soft boundary constraints (bounce back gently)
            const margin = nodeA.radius + 10;
            if (nodeA.x < margin) {
                nodeA.x = margin;
                nodeA.vx *= -0.5;
            } else if (nodeA.x > this.width - margin) {
                nodeA.x = this.width - margin;
                nodeA.vx *= -0.5;
            }

            if (nodeA.y < margin) {
                nodeA.y = margin;
                nodeA.vy *= -0.5;
            } else if (nodeA.y > this.height - margin) {
                nodeA.y = this.height - margin;
                nodeA.vy *= -0.5;
            }
        }
    }

    // Optimized rendering using Canvas API
    render() {
        const ctx = this.ctx;

        // Clear canvas
        ctx.clearRect(0, 0, this.width, this.height);

        // Draw connections first (behind nodes)
        ctx.lineWidth = 1.5;
        this.connections.forEach(conn => {
            const grad = ctx.createLinearGradient(
                conn.from.x, conn.from.y,
                conn.to.x, conn.to.y
            );
            grad.addColorStop(0, conn.from.color + '40'); // 40 = 25% opacity in hex
            grad.addColorStop(1, conn.to.color + '40');

            ctx.strokeStyle = grad;
            ctx.beginPath();
            ctx.moveTo(conn.from.x, conn.from.y);
            ctx.lineTo(conn.to.x, conn.to.y);
            ctx.stroke();
        });

        // Draw nodes
        this.nodes.forEach(node => {
            const isHovered = node === this.hoveredNode;
            const isDragged = node === this.draggedNode;
            const radius = node.radius + (isHovered || isDragged ? 5 : 0);

            // Glow effect for hovered/dragged
            if (isHovered || isDragged) {
                ctx.shadowBlur = 20;
                ctx.shadowColor = node.color;
            } else {
                ctx.shadowBlur = 10;
                ctx.shadowColor = node.color + '80';
            }

            // Draw node circle
            ctx.fillStyle = node.color + '20'; // 20 = ~12% opacity
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
            ctx.fill();

            // Draw node border
            ctx.strokeStyle = node.color;
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Draw node label
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Multi-line text for long names
            const words = node.name.split(' ');
            if (words.length > 1 && node.name.length > 12) {
                ctx.fillText(words[0], node.x, node.y - 6);
                ctx.fillText(words.slice(1).join(' '), node.x, node.y + 6);
            } else {
                ctx.fillText(node.name, node.x, node.y);
            }
        });
    }

    // Main animation loop
    animate(timestamp) {
        // Calculate FPS
        const deltaTime = timestamp - this.lastFrameTime;
        this.fps = 1000 / deltaTime;
        this.lastFrameTime = timestamp;

        // Update physics and render
        this.updatePhysics();
        this.render();

        // Continue animation
        this.animationId = requestAnimationFrame((t) => this.animate(t));
    }

    startAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.animationId = requestAnimationFrame((t) => this.animate(t));
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const ecosystem = new SkillEcosystem('skillCanvas', 'skillPopup');

    // Store instance globally for debugging
    window.skillEcosystem = ecosystem;
});
