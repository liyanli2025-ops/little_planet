import test from 'node:test';
import assert from 'node:assert/strict';
import {foodCatalog} from '../dist/food-catalog.js';
import {makeFood} from '../dist/food-models.js';
import {Box3,Vector3} from '../dist/vendor/three.module.js';
test('every fridge food has finite geometry small enough for its shelf',()=>{for(const f of Object.values(foodCatalog)){const g=makeFood(f.id),b=new Box3().setFromObject(g),size=b.getSize(new Vector3());assert([size.x,size.y,size.z].every(v=>Number.isFinite(v)&&v>0&&v<.6),f.id+JSON.stringify(size));const gs=new Set(),ms=new Set();g.traverse(m=>{if(m.geometry)gs.add(m.geometry);if(m.material)ms.add(m.material)});gs.forEach(x=>x.dispose());ms.forEach(x=>x.dispose())}});
import {recipes} from '../dist/recipe-catalog.js';
import {makeDish} from '../dist/dish-models.js';
test('all recipes use known ingredients and render a finite plated dish',()=>{for(const r of Object.values(recipes)){for(const [food,qty]of Object.entries(r.needs)){assert(foodCatalog[food],r.id+': '+food);assert(qty>0)}const dish=makeDish(r.id),b=new Box3().setFromObject(dish),v=b.getSize(new Vector3());assert([v.x,v.y,v.z].every(n=>Number.isFinite(n)&&n>0&&n<1),r.id);const gs=new Set(),ms=new Set();dish.traverse(m=>{if(m.geometry)gs.add(m.geometry);if(m.material)ms.add(m.material)});gs.forEach(x=>x.dispose());ms.forEach(x=>x.dispose())}});
