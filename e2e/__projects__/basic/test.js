import { mount } from '@vue/test-utils'
import TypeScript from './components/TypeScript.vue'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import jestVue from 'vue-jest'
import RenderFunction from './components/RenderFunction.vue'
import Jade from './components/Jade.vue'
import FunctionalSFC from './components/FunctionalSFC.vue'
import Basic from './components/Basic.vue'
import BasicSrc from './components/BasicSrc.vue'
import { randomExport } from './components/NamedExport.vue'
import Coffee from './components/Coffee.vue'
import CoffeeScript from './components/CoffeeScript.vue'
import FunctionalSFCParent from './components/FunctionalSFCParent.vue'
import NoScript from './components/NoScript.vue'
import Pug from './components/Pug.vue'
import PugRelative from './components/PugRelativeExtends.vue'
import Jsx from './components/Jsx.vue'
import Constructor from './components/Constructor.vue'
import istanbulSourceMapping from 'istanbul-lib-source-maps'
import istanbulCoverage from 'istanbul-lib-coverage'
import { transformSync } from '@babel/core'
import babelPluginIstanbul from 'babel-plugin-istanbul'

test('processes .vue files', () => {
  const wrapper = mount(Basic)
  expect(wrapper.vm.msg).toEqual('Welcome to Your Vue.js App')
  wrapper.vm.toggleClass()
})

test('processes .vue files with src attributes', () => {
  const wrapper = mount(BasicSrc)
  wrapper.vm.toggleClass()
})

test('handles named exports', () => {
  expect(randomExport).toEqual(42)
})

test('generates source maps for .vue files', () => {
  const filePath = resolve(__dirname, './components/Basic.vue')
  const fileString = readFileSync(filePath, { encoding: 'utf8' })

  const { code } = jestVue.process(fileString, filePath, {
    moduleFileExtensions: ['js', 'vue']
  })

  expect(code).toMatchSnapshot()
})

test('generates source maps using src attributes', () => {
  const filePath = resolve(__dirname, './components/SourceMapsSrc.vue')
  const fileString = readFileSync(filePath, { encoding: 'utf8' })

  const { code } = jestVue.process(fileString, filePath, {
    moduleFileExtensions: ['js', 'vue']
  })

  expect(code).toMatchSnapshot()
})

test('generates source maps correct for mapping coverage', () => {
  const filePath = resolve(__dirname, './components/Coverage.vue')
  const fileString = readFileSync(filePath, { encoding: 'utf8' })

  const mapStore = istanbulSourceMapping.createSourceMapStore()
  const { code, map } = jestVue.process(fileString, filePath, {
    moduleFileExtensions: ['js', 'vue']
  })
  mapStore.registerMap(filePath, map.toJSON())

  const coverageMap = istanbulCoverage.createCoverageMap()
  transformSync(code, {
    filename: filePath,
    plugins: [
      [
        babelPluginIstanbul,
        {
          onCover: (file, coverage) => {
            coverageMap.addFileCoverage(coverage)
          }
        }
      ]
    ]
  })

  const mappedCoverage = mapStore
    .transformCoverage(coverageMap)
    .map.fileCoverageFor(filePath)

  // const coveredFn = () => { /*...*/ }
  expect(Object.values(mappedCoverage.fnMap)).toContainEqual(
    expect.objectContaining({
      name: 'coveredFn',
      decl: {
        start: { line: 6, column: 6 },
        end: { line: 6, column: 15 }
      }
    })
  )

  // const uncoveredFn = () => {}
  expect(Object.values(mappedCoverage.fnMap)).toContainEqual(
    expect.objectContaining({
      name: 'uncoveredFn',
      decl: {
        start: { line: 9, column: 6 },
        end: { line: 9, column: 17 }
      }
    })
  )

  // if (branch) { /*...*/ } else { /*...*/ }
  expect(Object.values(mappedCoverage.branchMap)).toContainEqual(
    expect.objectContaining({
      type: 'if',
      locations: [
        {
          start: { line: 12, column: 0 },
          end: { line: 16, column: Infinity }
        },
        {
          start: { line: 12, column: 0 },
          end: { line: 16, column: Infinity }
        }
      ]
    })
  )

  // const statement = true ? "I" : "E"
  expect(Object.values(mappedCoverage.branchMap)).toContainEqual(
    expect.objectContaining({
      type: 'cond-expr',
      locations: [
        {
          start: { line: 7, column: 27 },
          end: { line: 7, column: 33 }
        },
        {
          start: { line: 7, column: 33 },
          end: { line: 7, column: Infinity }
        }
      ]
    })
  )

  // = () => { /*...*/ }
  expect(Object.values(mappedCoverage.statementMap)).toContainEqual(
    expect.objectContaining({
      start: { line: 6, column: 18 },
      end: { line: 8, column: Infinity }
    })
  )

  // = true ? "I" : "E"
  expect(Object.values(mappedCoverage.statementMap)).toContainEqual(
    expect.objectContaining({
      start: { line: 7, column: 20 },
      end: { line: 7, column: Infinity }
    })
  )

  // = () => {}
  expect(Object.values(mappedCoverage.statementMap)).toContainEqual(
    expect.objectContaining({
      start: { line: 9, column: 20 },
      end: { line: 9, column: Infinity }
    })
  )

  // = true
  expect(Object.values(mappedCoverage.statementMap)).toContainEqual(
    expect.objectContaining({
      start: { line: 11, column: 15 },
      end: { line: 11, column: Infinity }
    })
  )

  // if (branch) { /*...*/ } else { /*...*/ }
  expect(Object.values(mappedCoverage.statementMap)).toContainEqual(
    expect.objectContaining({
      start: { line: 12, column: 0 },
      end: { line: 16, column: Infinity }
    })
  )

  // coveredFn()
  expect(Object.values(mappedCoverage.statementMap)).toContainEqual(
    expect.objectContaining({
      start: { line: 13, column: 2 },
      end: { line: 13, column: Infinity }
    })
  )

  // uncoveredFn()
  expect(Object.values(mappedCoverage.statementMap)).toContainEqual(
    expect.objectContaining({
      start: { line: 15, column: 2 },
      end: { line: 15, column: Infinity }
    })
  )
})

test('processes .vue file using jsx', () => {
  const wrapper = mount(Jsx)
  expect(wrapper.is('div')).toBeTruthy()
})

test('processes extended functions', () => {
  const wrapper = mount(Constructor)
  expect(wrapper.is('div')).toBeTruthy()
})

test('processes .vue file with lang set to coffee', () => {
  const wrapper = mount(Coffee)
  expect(wrapper.is('div')).toBeTruthy()
})

test('processes .vue file with lang set to coffeescript', () => {
  const wrapper = mount(CoffeeScript)
  expect(wrapper.is('div')).toBeTruthy()
})

test('processes .vue files with lang set to typescript', () => {
  const wrapper = mount(TypeScript)
  expect(wrapper.is('div')).toBeTruthy()
})

test('processes functional components', () => {
  const clickSpy = jest.fn()
  const wrapper = mount(FunctionalSFC, {
    context: {
      props: { msg: { id: 1, title: 'foo' }, onClick: clickSpy }
    }
  })
  expect(wrapper.text().trim()).toBe('foo')
  wrapper.trigger('click')
  expect(clickSpy).toHaveBeenCalledWith(1)
})

test('processes SFC with functional template from parent', () => {
  const wrapper = mount(FunctionalSFCParent)
  expect(wrapper.text().trim()).toBe('foo')
})

test('handles missing script block', () => {
  const wrapper = mount(NoScript)
  expect(wrapper.contains('footer'))
})

test('processes .vue file with jade template', () => {
  const wrapper = mount(Jade)
  expect(wrapper.is('div')).toBeTruthy()
  expect(wrapper.classes()).toContain('jade')
})

test('processes pug templates', () => {
  const wrapper = mount(Pug)
  expect(wrapper.is('div')).toBeTruthy()
  expect(wrapper.classes()).toContain('pug-base')
  expect(wrapper.find('.pug-extended').exists()).toBeTruthy()
})

test('supports relative paths when extending templates from .pug files', () => {
  const wrapper = mount(PugRelative)
  expect(wrapper.is('div')).toBeTruthy()
  expect(wrapper.find('.pug-relative-base').exists()).toBeTruthy()
})

test('processes SFC with no template', () => {
  const wrapper = mount(RenderFunction)
  expect(wrapper.is('section')).toBe(true)
})
