class Game {
	constructor() {
		// 基础信息
		this.config = {
			background: 0x282828,
			ground: -1,
			cubeColor: 0xbebebe,
			cubeWidth: 4,
			cubeHeight: 2,
			cubeDeep: 4,
			jumperColor: 0x232323,
			jumperHeight: 2,
			jumperDeep: 1
		}
		this.score = 0
		this.scene = new THREE.Scene()
		this.renderer = new THREE.WebGLRenderer({ antialias: true })
		this.size = {
			width: window.innerWidth,
			height: window.innerHeight
		}
		// 正交相机
		this.camera = new THREE.OrthographicCamera(window.innerWidth / -50, window.innerWidth / 50, window.innerHeight / 50, window.innerHeight / -50, 0, 5000)
		// 相机的位置
		this.cameraPos = {
			curent: new THREE.Vector3(0, 0, 0),
			next: new THREE.Vector3()
		}
		// 方块
		this.cubes = []
		// 方块左边 or 右边
		this.cubeStat = {
			nextDir: ''
		}
		this.failedStat = {
			// 默认落在当前块上
			location: -1,
			// 距离，根据距离判断是否倒下去
			distance: 0
		}
		// 是否下落完成
		this.tallingStat = {
			end: false,
			speed: 0.2
		}
		// 速度
		this.jumperStat = {
			ready: false,
			xSpeed: 0,
			ySpeed: 0
		}
	}

	init() {
		this._setCamera()
		this._setRenderer()
		this._setLight()
		this._createCube()
		this._handleWindowResize()
		window.addEventListener('resize', () => {
			this._handleWindowResize()
		})
	}

	_handleWindowResize() {
		this._setSize()
		this.camera.left = this.size.width / -50
		this.camera.righ = this.size.width / 50
		this.camera.top = this.size.height / 50
		this.camera.botom = this.size.height / -50
		this.camera.updateProjectionMatrix()
		this.renderer.setSize(this.size.width, this.size.height)
		this._render()
	}

	// 设置相机位置
	_setCamera() {
		this.camera.position.set(100, 100, 100)
		// 对准镜头
		this.camera.lookAt(this.cameraPos.curent)
	}

	// 设置render
	_setRenderer() {
		this.renderer.setSize(this.size.width, this.size.height)
		this.renderer.setClearColor(this.config.background)
		document.body.appendChild(this.renderer.domElement)
	}

	// 创建cube
	_createCube() {
		let geometry = new THREE.CubeGeometry(this.config.cubeWidth, this.config.cubeHeight, this.config.cubeDeep)
		let material = new THREE.MeshLambertMaterial({ color: this.config.cubeColor })
		let cube = new THREE.Mesh(geometry, material)
		if (this.cubes.length) {
			// 随机一个方向 left x轴的负方向 right z轴
			this.cubeStat.nextDir = Math.random() > 0.5 ? 'left' : 'right'
			if (this.cubeStat.nextDir === 'left') {
				// 改变x轴
				cube.position.x = this.cubes[this.cubes.length - 1].position.x - Math.random() * 4 - 6
			} else {
				// 改变z轴
				cube.position.z = this.cubes[this.cubes.length - 1].position.z - Math.random() * 4 - 6
			}
		}
		this.cubes.push(cube)
		this.scene.add(cube)
	}

	// 设置灯光
	_setLight() {
		let directionalLight = new THREE.DirectionalLight(0xffffff, 1.1)
		directionalLight.position.set(3, 10, 5)
		this.scene.add(directionalLight)
		// 全景光，增加亮度
		let light = new THREE.AmbientLight(0xffffff, 0.3)
		this.scene.add(light)
	}

	// 渲染 
	_render() {
		this.renderer.render(this.scene, this.camera)
	}

	// 设置size
	_setSize() {
		this.size = {
			width: window.innerWidth,
			height: window.innerHeight
		}
	}
}