const classNames = require('classnames');
const Sticky = require('../../../dist/Sticky');

let content = [];
for (let i = 0; i < 10; i++) {
    content.push(
        '<p>',
        'Lorem Ipsum is simply dummy text of the printing and typesetting industry. ' +
        'Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, ' +
        'when an unknown printer took a galley of type and scrambled it to make a type specimen book. ' +
        'It has survived not only five centuries, but also the leap into electronic typesetting, ' +
        'remaining essentially unchanged. ' +
        'It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, ' +
        'and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.',
        '</p>'
    );
}
content = content.join('');

const TestText = ({ className, id }) => {
    return (
        <div id={id} className={classNames('test-text Ov(h)', className)}
                dangerouslySetInnerHTML={{__html: content}}/>
    );
}

const StickyDemo = () => {
    return (
        <div className='H(1800px)'>
            <div className='IbBox W(1/4)'>
                <Sticky>
                    <TestText id='sticky-1' className='H(300px) Bgc(#defd35)'/>
                </Sticky>
            </div>
            <div className='IbBox W(1/4)'>
                <Sticky bottomBoundary='#ref'>
                    <TestText id='sticky-2' className='H(1200px) Bgc(#defd35)'/>
                </Sticky>
            </div>
            <div className='IbBox W(1/4)'>
                <Sticky>
                    <TestText id='sticky-2' className='H(1200px) Bgc(#defd35)'/>
                </Sticky>
            </div>
            <div id='ref' className='IbBox W(1/4)'>
                <TestText className='H(1500px) Bgc(#defd35)'/>
            </div>
        </div>
    );
}

module.exports = StickyDemo;
