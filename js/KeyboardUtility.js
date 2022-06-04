export const W = 'w';
export const A = 'a';
export const S = 's';
export const D = 'd';
export const Q = 'q';
export const E = 'e';
export const DIRECTIONS = [W, A, S, D];

export class KeyDisplay {

    map = new Map();

    constructor() {
        const w = document.createElement("div");
        const a = document.createElement("div");
        const s = document.createElement("div");
        const d = document.createElement("div");
        const q = document.createElement("div");
        const e = document.createElement("div");

        this.map.set(W, w);
        this.map.set(A, a);
        this.map.set(S, s);
        this.map.set(D, d);
        this.map.set(Q, q);
        this.map.set(E, e);

        this.map.forEach( (v, k) => {
            v.style.color = 'blue';
            v.style.fontSize = '50px';
            v.style.fontWeight = '800';
            v.style.position = 'absolute';
            v.textContent = k;
        })

        this.updatePosition();

        this.map.forEach( (v, _) => {
            document.body.append(v);
        })
    }

    updatePosition() {
        this.map.get(W).style.top = `${window.innerHeight - 150}px`;
        this.map.get(A).style.top = `${window.innerHeight - 100}px`;
        this.map.get(S).style.top = `${window.innerHeight - 100}px`;
        this.map.get(D).style.top = `${window.innerHeight - 100}px`;
        this.map.get(Q).style.top = `${window.innerHeight - 100}px`;
        this.map.get(E).style.top = `${window.innerHeight - 100}px`;

        this.map.get(W).style.left = `${250}px`;
        this.map.get(A).style.left = `${150}px`;
        this.map.get(S).style.left = `${250}px`;
        this.map.get(D).style.left = `${350}px`;
        this.map.get(Q).style.left = `${50}px`;
        this.map.get(E).style.left = `${450}px`;
    }

    down (key) {
        if (this.map.get(key.toLowerCase())) {
            this.map.get(key.toLowerCase()).style.color = 'red';
        }
    }

    up (key) {
        if (this.map.get(key.toLowerCase())) {
            this.map.get(key.toLowerCase()).style.color = 'blue';
        }
    }

}